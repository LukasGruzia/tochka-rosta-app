import { Tabs } from 'expo-router';
import { LiquidTabBar } from '@/components/LiquidTabBar';
const items=[['index','Главная'],['diary','Дневник'],['catalog','Каталог'],['flow','Поток'],['profile','Профиль']] as const;
export default function TabsLayout(){return <Tabs tabBar={(props)=><LiquidTabBar {...props}/>} screenOptions={{headerShown:false}}>{items.map(([name,title])=><Tabs.Screen key={name} name={name} options={{title}}/>)}</Tabs>;}
