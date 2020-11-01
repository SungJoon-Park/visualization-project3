Promise.all([
    d3.csv("companies.csv",d3.autoType),
    d3.csv("rounds.csv",d3.autoType),
    d3.csv("investments.csv",d3.autoType),
    d3.csv("acquisitions.csv",d3.autoType),
]).then(data=>{
    console.log(data);
    
})