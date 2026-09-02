const axios = require("axios");
const { performance } = require("perf_hooks");

const TOTAL = parseInt(process.argv[2]) || 10;

const URL = "http://localhost:3001/certificates";

async function sendRequest(index){

    const start = performance.now();

    try{

        await axios.get(URL);

        const latency =
            performance.now()-start;

        console.log(
            `[${index}/${TOTAL}] ${latency.toFixed(2)} ms`
        );

        return latency;

    }catch(err){

        console.log(
            `[${index}/${TOTAL}] FAILED`
        );

        return null;
    }

}

(async()=>{

    console.log(`\n===== Benchmark GET /certificates (${TOTAL} request) =====\n`);

    const result=[];

    for(let i=1;i<=TOTAL;i++){

        const latency =
            await sendRequest(i);

        if(latency!==null)
            result.push(latency);

    }

    const avg =
        result.reduce((a,b)=>a+b,0)/result.length;

    const min=Math.min(...result);

    const max=Math.max(...result);

    console.log("\n========== HASIL ==========");

    console.log(`Total Success : ${result.length}`);

    console.log(`Average       : ${avg.toFixed(2)} ms`);

    console.log(`Minimum       : ${min.toFixed(2)} ms`);

    console.log(`Maximum       : ${max.toFixed(2)} ms`);

})();