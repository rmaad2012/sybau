import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'
import { LogBox } from 'react-native';
import * as Linking from 'expo-linking';
LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer', 'Warning: MemoizedTNodeRenderer', 'Warning: TRenderEngineProvider']); // Ignore log notification by message

const _layout = () => {
    
  return (
    <AuthProvider>
        <MainLayout />
    </AuthProvider>
    
  )
}

const MainLayout = ()=>{
    const {setAuth, setUserData} = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams();

    useEffect(() => {
        // Handle deep links for email confirmation
        const handleDeepLink = (url) => {
            console.log('Deep link received:', url);
            if (url.includes('access_token') || url.includes('refresh_token')) {
                // This is an auth callback, let Supabase handle it
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) {
                        setAuth(session.user);
                        updateUserData(session.user);
                        router.replace("/home");
                    }
                });
            }
        };

        // Listen for incoming links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened with a deep link
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink(url);
            }
        });

        // triggers automatically when auth state changes
        supabase.auth.onAuthStateChange((_event, session) => {
        console.log('session: ', session?.user?.id);
        if (session) {
            setAuth(session?.user);
            updateUserData(session?.user); // update user like image, phone, bio
            router.replace("/home");
        } else {
            setAuth(null);
            router.replace('/welcome')
        }
        })

        return () => {
            subscription?.remove();
        };
    }, []);

    const updateUserData = async (user)=>{
        let res = await getUserData(user.id);
        if(res.success) setUserData(res.data);
    }

    return (
        <Stack 
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="(main)/postDetails"
                options={{
                    presentation: 'modal'
                }}
            />
        </Stack>
    )
}

export default _layout