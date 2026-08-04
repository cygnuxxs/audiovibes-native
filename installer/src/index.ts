import { NitroModules } from 'react-native-nitro-modules'
import { type Installer } from './specs/Installer.nitro'

export const apkInstaller = NitroModules.createHybridObject<Installer>("Installer")
