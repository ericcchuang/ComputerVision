import base64
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from PIL import Image, ExifTags
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import openvino as ov
import notebook_utils as utils
from io import BytesIO
from rapidfuzz import fuzz
import re
import json

with open("options.json", "r") as f:
    options = json.load(f)
valid_vehicle_ids = re.compile(options["valid_vehicle_ids"])

'''endpoint = options["endpoint"]
with open(options["vehicle_info"], "r") as f:
    vehicle_info_dat = json.load(f)
with open("garage_map.json", "r") as f:
    garage_map = json.load(f)
return_fields = options["return_fields"]
return_fields_map = options["return_fields_map"]
info_fields = options["info_fields"]
info_fields_map = options["info_fields_map"]'''

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model Initialization (runs once at startup) ---
core = ov.Core()
base_model_dir = Path("model")
detection_model_name = "vehicle-detection-0200"
recognition_model_name = "vehicle-attributes-recognition-barrier-0039"
precision = "FP32"
base_model_url = "https://storage.openvinotoolkit.org/repositories/open_model_zoo/2023.0/models_bin/1"
detection_model_url = f"{base_model_url}/{detection_model_name}/{precision}/{detection_model_name}.xml"
recognition_model_url = f"{base_model_url}/{recognition_model_name}/{precision}/{recognition_model_name}.xml"
detection_model_path = (base_model_dir / detection_model_name).with_suffix(".xml")
recognition_model_path = (base_model_dir / recognition_model_name).with_suffix(".xml")

# Download the detection model.
if not detection_model_path.exists():
    utils.download_file(detection_model_url, detection_model_name + ".xml", base_model_dir)
    utils.download_file(
        detection_model_url.replace(".xml", ".bin"),
        detection_model_name + ".bin",
        base_model_dir,
    )
# Download the recognition model.
if not recognition_model_path.exists():
    utils.download_file(recognition_model_url, recognition_model_name + ".xml", base_model_dir)
    utils.download_file(
        recognition_model_url.replace(".xml", ".bin"),
        recognition_model_name + ".bin",
        base_model_dir,
    )

def model_init(model_path: str):
    model = core.read_model(model=model_path)
    compiled_model = core.compile_model(model=model, device_name="CPU", config={"PERFORMANCE_HINT": "LATENCY"})
    input_keys = compiled_model.input(0)
    output_keys = compiled_model.output(0)
    return input_keys, output_keys, compiled_model

input_key_de, output_keys_de, compiled_model_de = model_init(detection_model_path)
input_key_re, output_keys_re, compiled_model_re = model_init(recognition_model_path)
height_de, width_de = list(input_key_de.shape)[2:]
height_re, width_re = list(input_key_re.shape)[2:]

ocr_precision = "FP16"
ocr_detection_model = "horizontal-text-detection-0001"
ocr_recognition_model = "text-recognition-0014"

ocr_detection_model_url = f"https://storage.openvinotoolkit.org/repositories/open_model_zoo/2023.0/models_bin/1/{ocr_detection_model}/{ocr_precision}/{ocr_detection_model}.xml"
ocr_recognition_model_url = f"https://storage.openvinotoolkit.org/repositories/open_model_zoo/2023.0/models_bin/1/{ocr_recognition_model}/{ocr_precision}/{ocr_recognition_model}.xml"

ocr_model_dir = Path("model")
ocr_detection_model_path = (ocr_model_dir / ocr_detection_model).with_suffix(".xml")
ocr_recognition_model_path = (ocr_model_dir / ocr_recognition_model).with_suffix(".xml")

# Download OCR detection model
if not ocr_detection_model_path.exists():
    utils.download_file(ocr_detection_model_url, ocr_detection_model + ".xml", ocr_model_dir)
    utils.download_file(ocr_detection_model_url.replace(".xml", ".bin"), ocr_detection_model + ".bin", ocr_model_dir)
# Download OCR recognition model
if not ocr_recognition_model_path.exists():
    utils.download_file(ocr_recognition_model_url, ocr_recognition_model + ".xml", ocr_model_dir)
    utils.download_file(ocr_recognition_model_url.replace(".xml", ".bin"), ocr_recognition_model + ".bin", ocr_model_dir)

ocr_detection_model_ov = core.read_model(ocr_detection_model_path)
ocr_detection_compiled_model = core.compile_model(model=ocr_detection_model_ov, device_name="CPU")
ocr_detection_input_layer = ocr_detection_compiled_model.input(0)
ocr_detection_output_key = ocr_detection_compiled_model.output("boxes")

ocr_recognition_model_ov = core.read_model(ocr_recognition_model_path)
ocr_recognition_compiled_model = core.compile_model(model=ocr_recognition_model_ov, device_name="CPU")
ocr_recognition_input_layer = ocr_recognition_compiled_model.input(0)
ocr_recognition_output_layer = ocr_recognition_compiled_model.output(0)

# --- Helper Functions ---
def get_fields_from_json(json_file, vehicle_id, fields, map):
    return_info = {}
    vehicle_list = json_file
    if vehicle_list and isinstance(vehicle_list, list):    
        vehicle_info = vehicle_list[vehicle_id]
        for i in fields:
            if i in vehicle_info:
                print(vehicle_info[i])
                custom_key = map.get(i, i)
                return_info[custom_key] = vehicle_info[i]
    return return_info

def get_bus_info(bus_number, detection, jpg_as_text, njtransit, max_score):
    '''url = endpoint + bus_number
    vehicle_info = requests.get(url).json()'''
    return_info = { "bus_number": bus_number, "detection": detection, "bus_image": jpg_as_text, "njtransit": njtransit, "score": max_score }

    '''if "bustime-response" in vehicle_info and "vehicle" in vehicle_info["bustime-response"]:
        #print(vehicle_info["bustime-response"]["vehicle"])
        return_info.update(get_fields_from_json(vehicle_info["bustime-response"]["vehicle"], 0, return_fields, return_fields_map))
        
        load_dotenv()
        GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

        if GOOGLE_MAPS_API_KEY is None:
            warnings.warn("Missing GOOGLE_MAPS_API_KEY")

        lat = vehicle_info["bustime-response"]["vehicle"][0].get("lat")
        lon = vehicle_info["bustime-response"]["vehicle"][0].get("lon")

        if lat and lon and GOOGLE_MAPS_API_KEY:
            response = requests.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={"latlng": f"{lat},{lon}", "key": GOOGLE_MAPS_API_KEY}
            )
            try:
                return_info["location"] = response.json().get("results", [])[0].get("formatted_address", "No location found")
            except IndexError:
                return_info["location"] = "No location found"
        else:
            return_info["location"] = "No location available"
    else:
        return_info["error"] = "Vehicle is currently not in service"

    if vehicle_info_dat:
        return_info["error"] = "No vehicle information found"
        for vehicle in vehicle_info_dat:
            if vehicle.get("VehicleNum") == bus_number:
                return_info.update(get_fields_from_json([vehicle], 0, info_fields, info_fields_map))
                return_info["error"] = None
                return_info["detection"] = True
                garage_code = return_info.get("garage")
                if garage_code:
                    return_info["garage"] = garage_map.get(garage_code, "Other")
                break'''

    return JSONResponse(content=return_info)

@app.get("/")
def root():
    return {"Congrats!": "The API is up and running! YAY!"}

# --- API Endpoint ---
@app.post("/scanBusNumber")
async def scanBusNumber(file: UploadFile = File(...)):

    # --- Helper Functions ---
    
    def crop_images(bgr_image, resized_image, boxes, threshold=0.6, padding=50):
        (real_y, real_x), (resized_y, resized_x) = bgr_image.shape[:2], resized_image.shape[:2]
        ratio_x, ratio_y = real_x / resized_x, real_y / resized_y
        boxes = boxes[:, 2:]
        car_position = []

        for box in boxes:
            conf = box[0]
            #print(f"Confidence: {conf}")
            if conf > threshold:
                coords = []
                for idx, corner_position in enumerate(box[1:]):
                    if idx % 2 == 0:  # x
                        val = int(corner_position * ratio_x * resized_x)
                        coords.append(val)
                    else:  # y
                        val = int(corner_position * ratio_y * resized_y)
                        coords.append(val)
                x_min, y_min, x_max, y_max = coords

                # Expand box with padding, and clip to image bounds
                x_min = max(0, x_min - padding)
                y_min = max(0, y_min - padding)
                x_max = min(real_x, x_max + padding)
                y_max = min(real_y, y_max + padding)

                car_position.append([x_min, y_min, x_max, y_max])

        return car_position
    
    def vehicle_recognition(compiled_model_re, input_size, raw_image):
        colors = ["White", "Gray", "Yellow", "Red", "Green", "Blue", "Black"]
        types = ["Car", "Bus", "Truck", "Van"]
        if raw_image is None or raw_image.size == 0:
            print("Invalid or empty image passed for recognition.")
            return None, None
        resized_image_re = cv2.resize(raw_image, input_size)
        input_image_re = np.expand_dims(resized_image_re.transpose(2, 0, 1), 0)
        predict_colors = compiled_model_re([input_image_re])[compiled_model_re.output(1)]
        predict_colors = np.squeeze(predict_colors, (2, 3))
        predict_types = compiled_model_re([input_image_re])[compiled_model_re.output(0)]
        predict_types = np.squeeze(predict_types, (2, 3))
        attr_color, attr_type = (
            colors[np.argmax(predict_colors)],
            types[np.argmax(predict_types)],
        )
        print(attr_color, attr_type)
        return attr_color, attr_type
    
    def display_bus(compiled_model_re):
        carNumber = 0
        # Iterate through all detected cars.
        for x_min, y_min, x_max, y_max in car_position:
            # Select a vehicle to recognize.
            pos = car_position[carNumber]
            carNumber += 1
            attr_color, attr_type = vehicle_recognition(compiled_model_re, (72, 72), image_de[y_min:y_max, x_min:x_max])
            # Crop the image with [y_min:y_max, x_min:x_max].
            if attr_type == "Bus" or attr_type == "Truck":
                test_car = image_de[pos[1] : pos[3], pos[0] : pos[2]]
                print( attr_color , attr_type)
                # Resize the image to input_size.
                return test_car
        pos = car_position[0]
        return image_de[pos[1] : pos[3], pos[0] : pos[2]] #returning first vehicle found
    
    def multiply_by_ratio(ratio_x, ratio_y, box):
        return [max(shape * ratio_y, 10) if idx % 2 else shape * ratio_x for idx, shape in enumerate(box[:-1])]

    def run_preprocesing_on_crop(crop, net_shape):
        # Make sure input is uint8 and 3-channel
        if crop.dtype != np.uint8:
            crop = (crop * 255).astype(np.uint8)
        if len(crop.shape) == 2 or crop.shape[2] != 3:
            crop = cv2.cvtColor(crop, cv2.COLOR_GRAY2BGR)

        # Optional denoising
        denoised = cv2.fastNlMeansDenoisingColored(crop, None, 10, 10, 7, 21)

        # Convert to grayscale to match model input (1 channel)
        gray = cv2.cvtColor(denoised, cv2.COLOR_BGR2GRAY)

        # Resize to model's input shape (width, height)
        resized = cv2.resize(gray, net_shape)

        # Add batch and channel dims: [1, 1, H, W]
        temp_img = resized.reshape(1, 1, net_shape[1], net_shape[0])  # (1, 1, 32, 128)

        return temp_img

    
    def find_vehicle_number():
        bus_number = None
        for i in annotations:
            try:
                match = valid_vehicle_ids.match(i)
                if match:
                    print (f"Detected number: {i}")
                    bus_number = i
            except:
                continue
        print(f"Final selected number: {bus_number}\n\n")
        return bus_number

    # --- Main Logic ---

    detection = False
    
    print("Received file successfully:", file.filename)

    # Read the uploaded file
    content = await file.read()

    # Open and rotate the image using Pillow
    image = Image.open(BytesIO(content))

    # Handle EXIF orientation
    try:
        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break
        exif = image._getexif()
        if exif is not None:
            orientation_value = exif.get(orientation, None)

            if orientation_value == 3:
                image = image.rotate(180, expand=True)
            elif orientation_value == 6:
                image = image.rotate(270, expand=True)
            elif orientation_value == 8:
                image = image.rotate(90, expand=True)
    except Exception as e:
        print(f"EXIF rotation failed: {e}")

    # Convert to JPEG in memory
    rgb_image = image.convert('RGB')
    jpeg_buffer = BytesIO()
    rgb_image.save(jpeg_buffer, format="JPEG")
    jpeg_bytes = jpeg_buffer.getvalue()

    # Decode for OpenCV
    nparr = np.frombuffer(jpeg_bytes, np.uint8)
    image_de = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    resized_image_de = cv2.resize(image_de, (width_de, height_de))
    input_image_de = np.expand_dims(resized_image_de.transpose(2, 0, 1), 0)
    boxes = compiled_model_de([input_image_de])[output_keys_de]
    boxes = np.squeeze(boxes, (0, 1))
    boxes = boxes[~np.all(boxes == 0, axis=1)]

    car_position = crop_images(image_de, resized_image_de, boxes)
    if car_position:
        print(f"{len(car_position)} vehicles detected.")
    else:
        print("No vehicles detected.\n\n")
        return JSONResponse(content={"bus_number": None,"detection": False, "bus_image": None, "error": "No vehicles detected"})

    result_image = display_bus(compiled_model_re)
    if result_image is None:
        print('No bus detected. Exiting...\n\n')
        return JSONResponse(content={"bus_number": None,"detection": False, "bus_image": None, "error": "No bus detected"})
    image = result_image
    print('Bus detected. Scanning number...')

    # OCR detection input shape
    N, C, H, W = ocr_detection_input_layer.shape
    resized_image = cv2.resize(image, (W, H))
    input_image = np.expand_dims(resized_image.transpose(2, 0, 1), 0)
    boxes = ocr_detection_compiled_model([input_image])[ocr_detection_output_key]
    boxes = boxes[~np.all(boxes == 0, axis=1)]

    # Recognition input shape
    _, _, H_rec, W_rec = ocr_recognition_input_layer.shape
    (real_y, real_x), (resized_y, resized_x) = image.shape[:2], resized_image.shape[:2]
    ratio_x, ratio_y = real_x / resized_x, real_y / resized_y

    # Grayscale and contrast for recognition
    grayscale_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    letters = "#1234567890abcdefghijklmnopqrstuvwxyz"
    annotations = list()
    for crop in boxes:
        (x_min, y_min, x_max, y_max) = map(int, multiply_by_ratio(ratio_x, ratio_y, crop))
        image_crop = run_preprocesing_on_crop(grayscale_image[y_min:y_max, x_min:x_max], (W_rec, H_rec))
        result = ocr_recognition_compiled_model([image_crop])[ocr_recognition_output_layer]
        recognition_results_test = np.squeeze(result)
        annotation = list()
        discard = False
        for letter in recognition_results_test:
            confidence = np.max(letter)
            parsed_letter = letters[letter.argmax()]
            #print(f" Letter: {parsed_letter}  --  Letter confidence: {confidence}")
            if parsed_letter == letters[0]:
                continue
            annotation.append(parsed_letter)
        annotations.append("".join(annotation))
    print(" ".join(annotations))

    njtransit = False

    max_score = 0

    for annotation in annotations:
        score = fuzz.ratio(annotation.lower(), "njtransit")
        if score > max_score:
            max_score = score
        
    print(f"Similarity score: {max_score}")
    if max_score >= 70:
        print("This is most likely an NJ Transit Bus")
        njtransit = True
    else:
        print("No confidence this is an NJ Transit Bus")

    bus_number = None    
    bus_number = find_vehicle_number()
    if bus_number is not None:
        detection = True
    else:
        print('Could not detect bus number.\n\n')
        return JSONResponse(content={"bus_number": None,"detection": False, "bus_image": None, "error": "Could not detect bus number"})

    _, buffer = cv2.imencode('.jpg', result_image)  # or '.png'
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')

    return get_bus_info(bus_number, detection, jpg_as_text, njtransit, max_score) 

@app.post("/busInfo")
async def bus_info(vehicle_number: str = Form()):
    return(get_bus_info(vehicle_number, True, None, False, 0))

