package com.aipixelstudio.vo;

/** Metadata returned after a source image has been stored successfully. */
public class ImageUploadVO {
    private String fileName;
    private String url;
    private int width;
    private int height;

    public ImageUploadVO(String fileName, String url, int width, int height) {
        this.fileName = fileName;
        this.url = url;
        this.width = width;
        this.height = height;
    }

    public String getFileName() { return fileName; }
    public String getUrl() { return url; }
    public int getWidth() { return width; }
    public int getHeight() { return height; }
}
