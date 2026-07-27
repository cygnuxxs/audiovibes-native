declare module "*.css";

declare module "*.svg" {
  import React from 'react';
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

interface Song {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  language: string;
  year: string;
  downloadUrl: string;
  play_count: string;
  explicit_content: string;
  music: string;
  album: string;
  label: string;
  kbps_320: string;
  encrypted_media_url: string;
  duration: number;
  copyright_text: string;
  release_date: string | null;
  primary_artist_id?: string;
  primary_artist_name?: string;
  primary_artist_role?: string;
  primary_artist_image?: string;
  primary_artist_type?: string;
  primary_artist_perma_url?: string;
  artists?: Artist[];
}

interface Artist {
  id: string;
  name: string;
  role: string;
  image: string;
  type: string;
  perma_url: string;
}
