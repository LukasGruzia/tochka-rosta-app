import * as FileSystem from 'expo-file-system/legacy';
import { getAvatarExtension } from './avatarFile';
const directory=`${FileSystem.documentDirectory}profile/`;
export async function persistAvatar(sourceUri:string,previousUri?:string|null){await FileSystem.makeDirectoryAsync(directory,{intermediates:true});const target=`${directory}avatar-${Date.now()}.${getAvatarExtension(sourceUri)}`;await FileSystem.copyAsync({from:sourceUri,to:target});if(previousUri&&previousUri!==target&&previousUri.startsWith(directory))await FileSystem.deleteAsync(previousUri,{idempotent:true});return target;}
export async function deleteStoredAvatar(uri?:string|null){if(uri&&uri.startsWith(directory))await FileSystem.deleteAsync(uri,{idempotent:true});}
export function isPersistentAvatar(uri?:string|null){return Boolean(uri?.startsWith(directory));}
