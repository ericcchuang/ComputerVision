const fs = require('fs');

const api = process.env.API;

const config = {
    scanEndpoint: `${api}/scanBusNumber`,
    busInfoEndpoint: `${api}/busInfo`
};

fs.writeFileSync('public/config.json', JSON.stringify(config, null, 2));
console.log('config.json written to public/');
