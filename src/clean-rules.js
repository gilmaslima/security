const util = require('util')
const exec = util.promisify(require('child_process').exec)


init().then().catch(e => {console.log(e)})

async function init(){

    for (let index = 1; index < 1000; index++) {
        
        const command = `iptables -L | grep DROP`
        const { stdout, stderr } = await exec(command)
        if(stderr){
            console.log('Error:', stderr)
        }
        
    }

}