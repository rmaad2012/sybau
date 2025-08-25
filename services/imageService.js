import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";
import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';
import { supabaseUrl } from "../constants";

export const uploadFile = async (folderName, fileUri, isImage=true)=>{
    try{
        // Validate file exists
        if (!fileUri) {
            return {success: false, msg: "No file selected"};
        }

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
            return {success: false, msg: "File does not exist"};
        }

        // Check file size (50MB limit)
        if (fileInfo.size > 52428800) {
            return {success: false, msg: "File too large. Maximum size is 50MB"};
        }

        let fileName = getFilePath(folderName, isImage);
        console.log('Uploading file:', fileName, 'from:', fileUri);

        const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        let fileData = await decode(fileBase64);
        
        // Determine content type based on file extension
        let contentType = isImage ? "image/png" : "video/mp4";
        if (fileUri.includes('.jpg') || fileUri.includes('.jpeg')) {
            contentType = "image/jpeg";
        } else if (fileUri.includes('.gif')) {
            contentType = "image/gif";
        } else if (fileUri.includes('.webp')) {
            contentType = "image/webp";
        }

        console.log('Uploading to bucket: uploads, contentType:', contentType);
        
        const { data, error } = await supabase
        .storage
        .from('uploads')
        .upload(fileName, fileData, {
            cacheControl: '3600',
            upsert: true,
            contentType: contentType,
        });

        if(error){
            console.log('Storage upload error:', error);
            return {success: false, msg: `Upload failed: ${error.message}`};
        }
            
        console.log('Upload successful:', data.path);
        return {success: true, data: data.path};
    }catch(error){
        console.log('File upload error:', error);
        return {success: false, msg: `Upload error: ${error.message}`};
    }
}

export const getFilePath = (folderName, isImage=true)=>{
    // Remove the leading slash to avoid path issues
    return `${folderName}/${(new Date()).getTime()}${isImage? '.png': '.mp4'}`;
}

export const getUserImageSrc = (imagePath)=>{
    if(imagePath){
        return getSupabaseFileUrl(imagePath);
    }else{
        return require('../assets/images/defaultUser.png');
    }
}

export const getSupabaseFileUrl = (filePath)=>{
    if(filePath)
        return {uri: `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`};
    return null;
}

export const downloadFile = async (url)=>{
    try {
        // Start the download
        const { uri } = await FileSystem.downloadAsync(url, getLocalFilePath(url));
        return uri;
    } catch (e) {
        return null;
    }
}

const getLocalFilePath = (filePath)=>{
    let fileName = filePath.split('/').pop();
    return `${FileSystem.documentDirectory}${fileName}`;
}