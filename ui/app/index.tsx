import {
  Text,
  View,
  Button,
  Animated,
  Dimensions,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Switch,
  Image,
  InputAccessoryView,
  Keyboard,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState, useEffect, useRef } from "react";
import { enableScreens } from "react-native-screens";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import openMap from "react-native-open-maps";
import { Stack } from "expo-router";
import * as endPoints from "./endpoints.json";
import * as FileSystem from "expo-file-system";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Speech from "expo-speech";
import Feather from "@expo/vector-icons/Feather";
import styles from "./_styles";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { BrowserRouter } from 'react-router-dom';
import { registerRootComponent } from 'expo';

registerRootComponent(HomeScreen);

enableScreens();

export const unstable_settings = {
  initialRouteName: "index",
};

export default function HomeScreen() {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraGranted, setCameraGranted] = useState(false);
  const TTSCurrentlySpeakingRef = useRef(false);
  const manualSearchRef = useRef(false);

  //tts function
  const [ttsEnabled, setTTSEnabled] = useState(false);
  const ttsEnabledRef = useRef(ttsEnabled);
  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
    if (ttsEnabled) {
      speak("TTS enabled");
    }
  }, [ttsEnabled]);

  const getMobileOS = () => {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;

    if (/android/i.test(userAgent)) {
      return "Android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return "iOS";
    }

    return "Other";
  };

  function stopSpeaking() {
    if (Platform.OS === "web") {
      window.speechSynthesis.cancel();
    } else {
      Speech.stop();
    }
  }

  function EnableTTS() {
    const handleTTSToggle = (value: boolean) => {
      setTTSEnabled(value);
      if (!value) {
        stopSpeaking();
      }
    };

    return (
      <View style={styles.toggleContainer}>
        <Text style={styles.label}>Text-to-Speech</Text>
        <Switch value={ttsEnabled} onValueChange={handleTTSToggle} />
      </View>
    );
  }

  function EnableCamera() {
    const handleCameraToggle = async (value3: boolean) => {
      if (!value3) {
        setCameraGranted(false);
        scanningRef.current = false;
      } else {
        const cameraStatus = await requestPermission();
        if (!cameraStatus.granted) {
          Alert.alert("Permission to access camera was denied");
          setCameraGranted(false);
        } else {
          setCameraGranted(true);
          handleScanAgain();
        }
      }
    };

    return (
      <View style={styles.toggleContainer}>
        <Text style={styles.label}>Camera Access</Text>
        <Switch value={cameraGranted} onValueChange={handleCameraToggle} />
      </View>
    );
  }

  const EmptyIndicator = () => {
    return (
      <View style={[styles.emptyIndicator, { borderColor: "green" }]}>
        <MaterialIcons name="man" size={18} color="green" />
        <MaterialIcons
          name="man"
          size={18}
          color="grey"
          style={{ opacity: 0.5 }}
        />
        <MaterialIcons
          name="man"
          size={18}
          color="grey"
          style={{ opacity: 0.5 }}
        />
      </View>
    );
  };

  const HalfEmptyIndicator = () => {
    return (
      <View style={[styles.emptyIndicator, { borderColor: "orange" }]}>
        <MaterialIcons name="man" size={18} color="orange" />
        <MaterialIcons name="man" size={18} color="orange" />
        <MaterialIcons
          name="man"
          size={18}
          color="grey"
          style={{ opacity: 0.5 }}
        />
      </View>
    );
  };

  const FullIndicator = () => {
    return (
      <View style={[styles.emptyIndicator, { borderColor: "red" }]}>
        <MaterialIcons name="man" size={18} color="red" />
        <MaterialIcons name="man" size={18} color="red" />
        <MaterialIcons name="man" size={18} color="red" />
      </View>
    );
  };

  //zoom function
  const [zoom, setZoom] = useState(0.1);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const listenerId = scale.addListener(({ value }) => {
      const newZoom = Math.min(Math.max((value - 1) / 50 + zoom, 0), 1);
      setZoom(newZoom);
    });
    return () => scale.removeListener(listenerId);
  }, [zoom]);

  const initialZoom = useRef(zoom);
  const initialScale = useRef(1);
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      initialZoom.current = zoom;
      initialScale.current = 1;
    })
    .onUpdate((event) => {
      const sensitivity = 0.02;
      const scaleDelta = event.scale - 1;
      const newZoom = Math.min(Math.max(zoom + scaleDelta * sensitivity, 0), 1);
      setZoom(newZoom);
    });

  //rotation function
  const [orientation, setOrientation] =
    useState<ScreenOrientation.Orientation | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      const lockOrientation = async () => {
        await ScreenOrientation.unlockAsync(); // Allow auto-rotation
      };
      lockOrientation();

      const subscription = ScreenOrientation.addOrientationChangeListener(
        (event) => {
          setOrientation(event.orientationInfo.orientation);
        }
      );

      return () => {
        ScreenOrientation.removeOrientationChangeListeners();
        subscription &&
          ScreenOrientation.removeOrientationChangeListener(subscription);
      };
    }
  }, []);

  const isLandscape =
    Platform.OS !== "web" &&
    (orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
      orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT);

  const isPortrait =
    Platform.OS !== "web" &&
    (orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
      orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN);

  const [windowDims, setWindowDims] = useState(Dimensions.get("window"));
  const cameraStyle = {
    width: windowDims.width,
    height: windowDims.height,
    flex: 1,
  };

  const cardWidth = {
    width: Math.min(windowDims.width * 0.9, 500),
  };

  //scanning function
  const scanningRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);

  const [loading, setLoading] = useState(true);
  const busNumberRef = useRef<string | null>(null);
  const busImageRef = useRef(null);

  const [busInfo, setBusInfo] = useState<Record<string, any> | null>(null);

  function handleCameraReady() {
    setCameraReady(true);
  }

  function handleScanAgain() {
    stopSpeaking();
    manualSearchRef.current = false;
    setLoading(true);
    busNumberRef.current = null;
    setBusInfo(null);
    startScanning();
  }

  async function startScanning() {
    busImageRef.current = null;
    scanningRef.current = true;
    while (scanningRef.current) {
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 1,
            base64: false,
            shutterSound: false,
            scale: 2,
          });
          // Send photo to API
          const formData = new FormData();
          if (Platform.OS === "web") {
            const res = await fetch(photo.uri);
            const blob = await res.blob();
            formData.append(
              "file",
              new File([blob], "photo.jpg", { type: "image/jpeg" })
            );
          } else {
            formData.append("file", {
              uri: photo.uri,
              name: "photo.jpg",
              type: "image/jpeg",
            } as any);
          }
          const response = await fetch(String(endPoints.scanEndpoint), {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json",
              //"Content-Type": "multipart/form-data",
            },
          });
          if (Platform.OS !== "web") {
            await FileSystem.deleteAsync(photo.uri, { idempotent: true });
          }
          const data = await response.json();

          console.log(
            "bus number: ",
            data.bus_number,
            " detection: ",
            data.detection,
            busInfo
          );
          if (data.detection) {
            manualSearchRef.current = false;
            stopSpeaking();
            setBusInfo(data);
            busNumberRef.current = data.bus_number;
            scanningRef.current = false;
            setLoading(false);
            busImageRef.current = data.bus_image;
          }
        } catch (err) {
          console.log("Error taking photo: ", err);
        }
      }
      // Add a small delay to avoid spamming the camera
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  function processTimestamp(timestamp: string) {
    try {
      const parsedDate = new Date(
        `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(
          6,
          8
        )}T${timestamp.slice(9)}:00`
      );
      let localTime = null;
      localTime = parsedDate.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      return localTime;
    } catch (e) {
      console.warn("Failed to parse timestamp:", timestamp);
      return null;
    }
  }

  function processLocation(location: string) {
    let address = null;
    address = location
      .replace(/,\s*\d{5}(?:-\d{4})?/g, "") // Remove 5-digit ZIPs and ZIP+4 formats after commas
      .replace(/\b\d{5}(?:-\d{4})?\b/g, "") // Remove standalone ZIP codes too
      .replace(/,\s*USA$/i, "") // Remove ", USA" at the end
      .replace(/\s{2,}/g, " ") // Collapse multiple spaces to one
      .trim();
    return address;
  }

  function processDestination(destination: string) {
    return String(destination)
      .replace(/^\d{1,3}\s*/, "")
      .replace(/\s+/g, " ")
      .replace(
        /\b(\d+)([A-Z]{2})\b/g,
        (_, num, suffix) => num + suffix.toLowerCase()
      )
      .replace(
        /\b([A-Z]{2,})\b/g,
        (match) => match.charAt(0) + match.slice(1).toLowerCase()
      );
  }

  useEffect(() => {
    if (ttsEnabled && busNumberRef.current && busInfo) {
      const info = busInfo;
      if (!info || typeof info !== "object") return;
      const delay = info.delay === true;

      // Build speech text from valid fields
      const spokenBusNumber = info.bus_number
        ? String(info.bus_number).split("").join(" ")
        : null;
      let speechText = "";

      if (spokenBusNumber) {
        speechText += `Bus Number ${spokenBusNumber}, ${info.passenger_load ? `Passenger Load ${info.passenger_load}` : ""
          }${info.wheelchair_accessible ? " (Wheelchair Accessible)" : ""}${delay ? " (Delayed)" : ""
          }. `;
      }
      if (info.garage) {
        speechText += `${info.garage} Garage. `;
      }
      if (info.route) {
        speechText += `Route ${info.route} `;
      }
      if (info.destination) {
        speechText += `to ${processDestination(info.destination)}.  `;
      }
      if (info.location) {
        speechText += `Current Location ${processLocation(info.location)}. `;
      }
      if (info.timestamp) {
        speechText += `Local Time ${processTimestamp(info.timestamp)} (EST). `;
      }
      if (info.seating_capacity) {
        speechText += `Seating Capacity is ${info.seating_capacity}. `;
      }
      if (info.error) {
        speechText += `Error: ${info.error}. `;
      }
      if (speechText.trim().length > 0) {
        speak(speechText);
      }
    }
  }, [ttsEnabled, busNumberRef.current, busInfo]);

  function ScannerView() {
    return (
      <CameraView
        ref={cameraRef}
        facing={"back"}
        zoom={zoom}
        style={cameraStyle}
        animateShutter={false}
        onCameraReady={handleCameraReady}
        pictureSize="highest"
      >
        <View style={styles.cameraControlView}>
          <CameraControls />
        </View>
      </CameraView>
    );
  }

  async function SubmitNumber(bus_number: string | null) {
    manualSearchRef.current = true;
    let busInfoResponse;
    const formData = new FormData();
    formData.append("vehicle_number", String(bus_number ?? ""));
    console.log(formData);
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    if (Platform.OS === "web") {
      const responseBusInfo = await fetch(String(endPoints.busInfoEndpoint), {
        method: "POST",
        body: formData,
      });
      busInfoResponse = await responseBusInfo.json();
    } else {
      const responseBusInfo = await fetch(String(endPoints.busInfoEndpoint), {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });
      busInfoResponse = await responseBusInfo.json();
    }
    console.log("Bus info response:", busInfoResponse);

    stopSpeaking();
    setLoading(false);
    busImageRef.current = null;
    setBusInfo(busInfoResponse);
    busNumberRef.current = bus_number;
    scanningRef.current = false;
  }

  function speak(text: string) {
    TTSCurrentlySpeakingRef.current = true;
    if (Platform.OS === "web") {
      const synth = window.speechSynthesis;
      if (!synth) {
        console.warn("Web Speech API not supported");
        TTSCurrentlySpeakingRef.current = false;
        return;
      }
      const speakWithVoice = () => {
        const voices = synth.getVoices();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice =
          voices.find((v) => v.lang.startsWith("en")) || voices[0];
        utterance.onend = () => {
          TTSCurrentlySpeakingRef.current = false;
        };
        utterance.onerror = () => {
          TTSCurrentlySpeakingRef.current = false;
        };
        synth.speak(utterance);
      };
      if (synth.getVoices().length) {
        speakWithVoice();
      } else {
        synth.addEventListener("voiceschanged", speakWithVoice);
      }
    } else {
      Speech.speak(text, {
        onDone: () => {
          TTSCurrentlySpeakingRef.current = false;
        },
        onError: () => {
          TTSCurrentlySpeakingRef.current = false;
        },
      });
    }
  }

  //layout and view
  function requestPermissionsButton() {
    (async () => {
      const cameraStatus = await requestPermission();
      if (!cameraStatus.granted) {
        Alert.alert("Permission to access camera was denied");
      } else {
        setCameraGranted(cameraStatus.granted);
        handleScanAgain();
      }
    })();
  }

  function CameraControls() {
    const inputAccessoryViewID = "numberInput";
    return (
      <View style={[styles.cardView, cardWidth, { flexDirection: "column" }]}>
        <View style={[styles.toggleContainer]}>
          {cameraGranted && (
            <>
              <ActivityIndicator
                size="large"
                color="#0000ff"
                style={{ paddingVertical: 10 }}
              />
              <Text style={{ paddingBottom: 10 }}>Scanning...</Text>
            </>
          )}
          <View style={styles.numberInput}>
            <TextInput
              inputAccessoryViewID={inputAccessoryViewID}
              maxLength={6}
              placeholder="Bus #"
              style={styles.textInput}
              onChangeText={(text) => {
                busNumberSubmitRef.current = text;
              }}
              onSubmitEditing={() =>
                SubmitNumber(busNumberSubmitRef.current.trim())
              }
              keyboardType="number-pad"
            />
            {Platform.OS !== "web" && (
              <InputAccessoryView nativeID={inputAccessoryViewID}>
                <View style={styles.mobileKeyboardClose}>
                  <Button title="Done" onPress={Keyboard.dismiss} />
                </View>
              </InputAccessoryView>
            )}
            <Button
              title="Submit"
              onPress={() => {
                const trimmed = busNumberSubmitRef.current.trim();
                console.log("Bus number submitted:", trimmed);
                if (trimmed) {
                  SubmitNumber(trimmed);
                }
              }}
            />
          </View>
        </View>
        <View style={[styles.toggleRow]}>
          <EnableTTS />
          <EnableCamera />
        </View>
      </View>
    );
  }

  const busNumberSubmitRef = useRef<string>("");

  return (
    <BrowserRouter basename={process.env.PUBLIC_URL || '/'}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack.Screen options={{ title: "Vehicle(s) Scanner" }} />
        {/* Control Panel Before Scanning or Submitting */}
        {busNumberRef.current === null && !cameraGranted && (
          <View style={[styles.busNumberContainer]}>
            <CameraControls />
          </View>
        )}
        {/* Control Panel After Scanning or Submitting */}
        {busNumberRef.current != null && (
          <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <View style={[styles.busNumberContainer]}>
              <View
                style={[styles.cardView, cardWidth, { alignItems: "center" }]}
              >
                <View style={{ flexDirection: "row", marginVertical: 16 }}>
                  <TouchableOpacity onPress={handleScanAgain} style={{ flex: 1, alignContent: 'center', alignItems: 'center' }}>
                    <Feather name="refresh-ccw" size={18} color="black" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.toggleRow]}>
                  <EnableTTS />
                </View>
              </View>
            </View>
            {/* Bus Info Card After Scanning or Submitting */}
            <View style={[styles.textView]}>
              {busInfo ? (
                <ScrollView
                  style={[styles.textView]}
                  contentContainerStyle={{
                    flexGrow: 1,
                    alignItems: "center",
                    marginHorizontal: 10,
                  }}
                >
                  <View style={[styles.cardView, cardWidth]}>
                    {(() => {
                      const info = busInfo;

                      console.log(info.passenger_load);
                      let load = null;
                      switch (info.passenger_load) {
                        case "EMPTY":
                          load = <EmptyIndicator />;
                          break;
                        case "HALF_EMPTY":
                          load = <HalfEmptyIndicator />;
                          break;
                        case "FULL":
                          load = <FullIndicator />;
                          break;
                        default:
                          load = null;
                          break;
                      }

                      return (
                        <>
                          <View style={[styles.textArea]}>
                            {
                              <Text style={styles.titleText}>
                                {info.bus_number}
                              </Text>
                            }
                            {load}
                            {info.wheelchair_accessible === "Y" ? (
                              <View style={[styles.wheelchair]}>
                                <Text> </Text>
                                <FontAwesome
                                  name="wheelchair"
                                  size={18}
                                  color="blue"
                                />
                              </View>
                            ) : (
                              ""
                            )}
                            {info.delay === true ? (
                              <Text style={styles.text}> (delayed)</Text>
                            ) : (
                              ""
                            )}
                          </View>
                          {info.garage && (
                            <Text style={[styles.subtitle]}>
                              {info.garage} Garage
                            </Text>
                          )}
                          {info.route && (
                            <Text style={[styles.subtitle]}>
                              Route {info.route}
                            </Text>
                          )}
                          {info.destination && (
                            <Text style={[styles.subtitle]}>
                              To {processDestination(info.destination)}
                            </Text>
                          )}
                          {info.location && manualSearchRef.current && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <View style={styles.icon}>
                                <Entypo
                                  name="location-pin"
                                  size={16}
                                  color="black"
                                />
                              </View>
                              <Text style={styles.text}>
                                {processLocation(info.location) + "  "}
                              </Text>
                              <TouchableOpacity
                                style={styles.icon}
                                onPress={() =>
                                  openMap({
                                    query: busInfo.location,
                                    provider:
                                      Platform.OS === "web"
                                        ? getMobileOS() === "iOS"
                                          ? "apple"
                                          : "google"
                                        : Platform.OS === "ios"
                                          ? "apple"
                                          : "google",
                                  })
                                }
                              >
                                <View style={styles.mapsLink}>
                                  <Ionicons
                                    name="open-outline"
                                    size={16}
                                    color="#0000EE"
                                    style={{
                                      paddingRight: 1,
                                      paddingLeft: 2,
                                      paddingBottom: 2,
                                    }}
                                  />
                                </View>
                              </TouchableOpacity>
                            </View>
                          )}
                          {info.timestamp && manualSearchRef.current && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <View style={styles.icon}>
                                <FontAwesome6
                                  name="clock"
                                  size={16}
                                  color="black"
                                />
                              </View>
                              <Text style={styles.text}>
                                {processTimestamp(info.timestamp)} (EST)
                              </Text>
                            </View>
                          )}
                          {info.seating_capacity && (
                            <Text style={styles.text}>
                              Seating Capacity: {info.seating_capacity}
                            </Text>
                          )}

                          {info.error && <Text>Error: {info.error}</Text>}
                        </>
                      );
                    })()}
                  </View>
                  {busImageRef.current != null && (
                    <View style={[styles.cardView, cardWidth]}>
                      <Image
                        source={{
                          uri: `data:image/png;base64,${busImageRef.current}`,
                        }}
                        style={styles.busImage}
                      />
                    </View>
                  )}
                </ScrollView>
              ) : (
                <Text>No Bus Info Returned from API</Text>
              )}
            </View>
          </View>
        )}
        {/* If Scanned, Bus Image is Shown */}
        {!busInfo && (
          <View
            style={[
              styles.cameraContainer,
              isLandscape && {
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            {/* Camera View. If on Web, show slider, else, use pinch gesture detector */}
            {permission?.granted === true && cameraGranted ? (
              Platform.OS === "web" ? (
                <>
                  <ScannerView />
                  <View style={styles.webSlider}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => {
                        if (zoom - 0.1 >= 0) {
                          setZoom(zoom - 0.1);
                        } else {
                          setZoom(0);
                        }
                      }}
                    >
                      <Feather name="zoom-out" size={18} color="black"></Feather>
                    </TouchableOpacity>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.currentTarget.value))}
                      style={{ width: 150 }}
                    />
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => {
                        if (zoom + 0.1 <= 1) {
                          setZoom(zoom + 0.1);
                        } else {
                          setZoom(1);
                        }
                      }}
                    >
                      <Feather name="zoom-in" size={18} color="black"></Feather>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <GestureDetector gesture={pinchGesture}>
                    <CameraView
                      ref={cameraRef}
                      facing={"back"}
                      zoom={zoom}
                      style={cameraStyle}
                      animateShutter={false}
                      onCameraReady={handleCameraReady}
                      pictureSize="highest"
                    >
                      <View style={styles.cameraControlView}>
                        <CameraControls />
                      </View>
                    </CameraView>
                  </GestureDetector>
                </>
              )
            ) : (
              <>
                <View style={styles.cameraContainer}>
                  <Button
                    title="Enable Camera"
                    onPress={requestPermissionsButton}
                  />
                </View>
              </>
            )}
          </View>
        )}
      </GestureHandlerRootView>
    </BrowserRouter>
  );
}
