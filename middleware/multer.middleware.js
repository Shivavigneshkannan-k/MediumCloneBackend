const multer =require("multer")
const storage = multer.diskStorage({
    destination:"../public/temp",
    filename: (req,file,callback)=>{
        callback(null,Date.now()+'-'+file.filename);
    }
})
const upload = multer({storage});
module.exports = upload;