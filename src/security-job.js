const fs = require('fs')
const moment = require('moment')
const { exec } = require("child_process")


init().then().catch(e => {console.log(e)})

async function init(){

    const result = fs.readFileSync('/var/log/auth.log', 'utf-8')
    //console.log(result)
    const lines = result.split('\n')
    .filter(f => {
        const day = moment().format('DD')
        //console.log(f.split(' ')[1].indexOf(`${day}`), day)
        return f.indexOf('Invalid') != -1 && f.split(' ')[1].indexOf(day) != -1 
    })

    const ips = lines.map(l => {
        return l.split(' ')[9]
    })
    
    
    console.log(ips)
    for (const key in ips) {
        const ip = ips[key]
        const command = `iptables -A INPUT -s ${ip} -j DROP`

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });
    }
    
}