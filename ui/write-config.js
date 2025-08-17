const fs = require('fs');

const api = process.env.API;

const config = {
    scanEndpoint: `${api}/scanBusNumber`,
    busInfoEndpoint: `${api}/busInfo`
};

fs.writeFileSync('app/endpoints.json', JSON.stringify(config, null, 2));