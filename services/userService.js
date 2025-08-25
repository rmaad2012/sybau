import { supabase } from "../lib/supabase";

export const getUserData = async (userId)=>{
    try{
        const { data, error } = await supabase
        .from('users')
        .select()
        .eq('id', userId)
        .single();

        if(error){
            return {success: false, msg: error?.message};
        }
        return {success: true, data};
    }catch(error){
        console.log('got error: ', error);
        return {success: false, msg: error.message};
    }
}

export const updateUser = async (userId, data)=>{
    try{
        const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId);

        if(error){
            return {success: false, msg: error?.message};
        }
        return {success: true};
    }catch(error){
        console.log('got error: ', error);
        return {success: false, msg: error.message};
    }
}

export const searchUsers = async (query) => {
    try {
        const { data, error } = await supabase
        .from('users')
        .select('id, name, image, bio')
        .ilike('name', `%${query}%`)
        .limit(10);

        if(error){
            return {success: false, msg: error?.message};
        }
        return {success: true, data};
    } catch(error) {
        console.log('searchUsers error: ', error);
        return {success: false, msg: error.message};
    }
};

