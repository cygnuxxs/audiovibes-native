import { type HybridObject } from 'react-native-nitro-modules'

export interface Metadata {
    title?: string
    artist?: string
    album?: string
    albumArtist?: string
    composer?: string
    genre?: string
    date?: string
    track?: number
    totalTracks?: number
    disc?: number
    totalDiscs?: number
    comment?: string
    copyright?: string
    encoder?: string
    publisher?: string
    lyrics?: string
    grouping?: string
    description?: string
    synopsis?: string
    show?: string
    episodeId?: string
    network?: string
    hdVideo?: boolean
    mediaType?: string
    bpm?: number
}

export interface Writer extends HybridObject<{ ios: "c++"; android: "c++" }> {
    writeMetadata(
        input: string,
        output: string,
        metadata: Metadata,
        artwork?: string
    ): Promise<void>

    readMetadata(input: string): Promise<Metadata>

    clearMetadata(
        input: string,
        output: string
    ): Promise<void>
}
