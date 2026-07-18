import { NitroModules } from 'react-native-nitro-modules'
import type { Writer } from './specs/Writer.nitro'
export const ffmpeg = NitroModules.createHybridObject<Writer>("Writer")
