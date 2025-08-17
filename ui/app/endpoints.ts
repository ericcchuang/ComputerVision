const baseUrl = process.env.NEXT_PUBLIC_API ?? '';

export const endPoints = {
    scanEndpoint: `${baseUrl}/scanBusNumber`,
    busInfoEndpoint: `${baseUrl}/busInfo`,
};
