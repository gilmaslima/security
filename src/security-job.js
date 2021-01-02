const fs = require('fs')
const moment = require('moment')
var CronJob = require('cron').CronJob
const util = require('util')
const exec = util.promisify(require('child_process').exec)

async function loadIptables(){

    const savedIps = new Set()
    const command = `iptables -L | grep DROP`
    const { stdout, stderr } = await exec(command)
    if(stderr){
        console.log('Error:', stderr)
    }
    const tmp = stdout.split('\n')
    tmp.forEach(f => {
        const ip = f.split('  ')[5]
        //console.log(ip)
        if(ip && ip.length > 0){
            savedIps.add(ip)
        }
    })
    return savedIps
}

async function filterIps(savedIps){
    const result = fs.readFileSync('/var/log/auth.log', 'utf-8')
    
    const lines = result.split('\n')
    .filter(f => {
        return f.indexOf('[preauth]') != -1
    })

    const ips = new Set()

    console.log('length', lines.length)
    lines.forEach(l => {
        const tmp = l.split(' ') 
        let ip = undefined
        
        tmp.forEach(t => {
            if(t.split('.').length === 4){
                ip = t
            }
        })
        
        console.log('Filtred:', ip)
        if(ip && !savedIps.has(ip)){
            ips.add(ip)
        }
    })
    console.log(ips)
    return Array.from(ips)
}

async function addRule(ip){
    const command = `iptables -A INPUT -s ${ip} -j DROP`
    
    const { stdout, stderr } = await exec(command)
    if(stderr){
        console.log('Error:', stderr)
    } 
    
    console.log('Exec:', command)   
}

var job = new CronJob('0 0 */1 * * *', function() {
    console.log('Running...')
    init().then().catch(e => {console.log(e)})
  }, null, true, null)
job.start();


async function init(){

    const savedIps = await loadIptables()
    console.log('savedIps:', savedIps)    
    const ips = await filterIps(savedIps)
    
    console.log('ips:', ips)
    for (const key in ips) {
        const ip = ips[key]
        await addRule(ip)
    }
}


init().then().catch(e => {console.log(e)})