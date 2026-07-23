package com.aipixelstudio.dto;

/** Data rendered by the administration dashboard. */
public record AdminStatisticsDTO(long userCount, long artworkCount, long todayUpload, long todayGenerate) { }
