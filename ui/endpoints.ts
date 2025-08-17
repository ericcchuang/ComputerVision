const baseUrl = process.env.EXPO_PUBLIC_API;

export const endPoints = {
    scanEndpoint: `${baseUrl}/scanBusNumber`,
    busInfoEndpoint: `${baseUrl}/busInfo`,
};
