package com.aipixelstudio.vo;

/** 原图保存成功后返回的图片元数据。 */
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
