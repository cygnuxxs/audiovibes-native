cmake_minimum_required(VERSION 3.9)

project(NitroWriter)

set(PACKAGE_NAME NitroWriter)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_VERBOSE_MAKEFILE ON)

# FFmpeg
set(FFMPEG_ROOT ${CMAKE_SOURCE_DIR}/../ffmpeg)

# Nitro module
add_library(${PACKAGE_NAME} SHARED
    src/main/cpp/cpp-adapter.cpp
    ${CMAKE_SOURCE_DIR}/../cpp/HybridWriter.cpp
)

# Generated Nitro code
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroWriter+autolinking.cmake)

# Include directories
target_include_directories(${PACKAGE_NAME}
    PRIVATE
    src/main/cpp
    ../cpp
    ${FFMPEG_ROOT}/include
)

# Android libraries
find_library(LOG_LIB log)
find_library(ANDROID_LIB android)

# Link libraries (plain signature)
find_library(ZLIB_LIB z)
   target_link_libraries(${PACKAGE_NAME}
       -Wl,--start-group
       ${FFMPEG_ROOT}/libs/${ANDROID_ABI}/libavformat.a
       ${FFMPEG_ROOT}/libs/${ANDROID_ABI}/libavcodec.a
       ${FFMPEG_ROOT}/libs/${ANDROID_ABI}/libavutil.a
       -Wl,--end-group
       ${LOG_LIB}
       ${ANDROID_LIB}
       ${ZLIB_LIB}
   )
