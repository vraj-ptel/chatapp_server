 import {v2 as cloudinary} from "cloudinary"
 const deleteFileFromCloudnary = async (public_ids = []) => {
    const p=public_ids.map((public_id)=>{
        return new Promise((resolve,reject)=>{
            cloudinary.uploader.destroy(public_id,(err,result)=>{
                if(err)
                    reject(err)
                else
                    resolve(result)
            })
        })
    })
    const res =await Promise.all(p);
}
export default deleteFileFromCloudnary;