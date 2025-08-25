import { supabase } from "../lib/supabase";

export const createNotification = async (notification)=>{
    try{
        const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

        if(error){
            console.log('notification error: ', error);
            return {success: false, msg: "Something went wrong!"};
        }
        return {success: true, data: data};

    }catch(error){
        console.log('notification error: ', error);
        return {success: false, msg: "Something went wrong!"};
    }
}

export const fetchNotifications = async (receiverId)=>{
    try{
        const { data, error } = await supabase
        .from('notifications')
        .select(`
            *,
            sender: users!notifications_sender_id_fkey ( id, name, image )
        `)
        .order('created_at', {ascending: false })
        .eq('receiver_id', receiverId);

        if(error){
            console.log('fetchNotifications error: ', error);
            return {success: false, msg: "Could not fetch the notifications"};
        }
        return {success: true, data: data};

    }catch(error){
        console.log('fetchNotifications error: ', error);
        return {success: false, msg: "Something went wrong!"};
    }
}

export const markNotificationAsRead = async (notificationId) => {
    try {
        const { error } = await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('id', notificationId);

        if(error){
            return {success: false, msg: error?.message};
        }
        return {success: true};
    } catch(error) {
        console.log('markNotificationAsRead error: ', error);
        return {success: false, msg: error.message};
    }
};

export const markAllNotificationsAsRead = async (receiverId) => {
    try {
        const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', receiverId)
        .eq('is_read', false);

        if(error){
            return {success: false, msg: error?.message};
        }
        return {success: true};
    } catch(error) {
        console.log('markAllNotificationsAsRead error: ', error);
        return {success: false, msg: error.message};
    }
};