const mong=require("mongoose");

function main()
{
   mong.connect(process.env.DB_Connect)
    .then(()=>{
        console.log("conected to mongo..");
    })
    .catch((er)=>{console.log("ereor")})
}

module.exports=main;