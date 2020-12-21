const fs = require('fs')
const moment = require('moment')
const { exec } = require("child_process")
var CronJob = require('cron').CronJob

var job = new CronJob('0 0 1 * * *', function() {
    init().then().catch(e => {console.log(e)})
  }, null, true, null)
job.start();

async function init(){

    const result = fs.readFileSync('/var/log/auth.log', 'utf-8')
    
    const lines = result.split('\n')
    .filter(f => {
        const day = moment().format('DD')
        return f.indexOf('Invalid') != -1 && f.split(' ')[1].indexOf(day) != -1 
    })

    const ips = new Set()

    lines.forEach(l => {
        ips.add(l.split(' ')[9])
    })
    
    ips.forEach(ip => {
        const command = `iptables -A INPUT -s ${ip} -j DROP`
        console.log(command)
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
        })
    })
    
}