package com.farmtech.smartfarm.util;

import com.farmtech.smartfarm.product.dto.ProductImageDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
public class UploadUtil {

  @Value("${aws.access-key}")
  private String accessKey;

  @Value("${aws.secret-key}")
  private String secretKey;

  @Value("${aws.bucket-name}")
  private String bucketName;

  @Value("${aws.region}")
  private String region;

  // 허용할 확장자 목록 (화이트리스트)
  private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");

  // S3 클라이언트 생성
  private S3Client getS3Client() {
    return S3Client.builder()
        .credentialsProvider(StaticCredentialsProvider.create(
            AwsBasicCredentials.create(accessKey, secretKey)))
        .region(Region.of(region))
        .build();
  }

  // 단일 파일 업로드
  public ProductImageDTO fileUpload(MultipartFile mainImgFile) {
    ProductImageDTO imgInfo = null;

    if (mainImgFile != null && !mainImgFile.isEmpty()) {
      imgInfo = new ProductImageDTO();

      try {
        String originFileName = mainImgFile.getOriginalFilename();
        String uuid = UUID.randomUUID().toString();
        // 파일명에서 확장자 추출 + 소문자로 통일
        // .toLowerCase() → ".JPG", ".Jpg" 같은 대문자도 ".jpg"로 바꿔줌
        String extension = originFileName.substring(originFileName.lastIndexOf(".")).toLowerCase();

        // 추출한 확장자가 허용 목록에 있는지 확인
        // .exe, .jsp, .sh 등 → 여기서 차단
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
          throw new IllegalArgumentException("허용되지 않는 파일 형식입니다: " + extension);
        }

        // Magic Bytes 검사: 파일 내용의 첫 8바이트를 직접 읽어서 진짜 이미지인지 확인
        // 확장자는 이름만 바꾸면 속일 수 있지만, 파일 내용 첫 바이트는 속이기 어려움
        try (InputStream is = mainImgFile.getInputStream()) {
          byte[] header = new byte[8]; // 첫 8바이트 저장할 배열
          is.read(header);             // 파일에서 8바이트 읽기

          // JPG 파일은 항상 FF D8 FF 로 시작 (JPG 규격)
          boolean isJpg  = header[0] == (byte)0xFF && header[1] == (byte)0xD8 && header[2] == (byte)0xFF;
          // PNG 파일은 항상 89 50 4E 47 로 시작 (PNG 규격)
          boolean isPng  = header[0] == (byte)0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
          // GIF 파일은 항상 47 49 46 38 로 시작 (= "GIF8" 아스키)
          boolean isGif  = header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38;
          // WebP 파일은 항상 52 49 46 46 로 시작 (= "RIFF" 아스키)
          boolean isWebp = header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46;

          // 위 4가지 중 어디에도 해당 안 되면 → 이미지가 아님 → 차단
          if (!isJpg && !isPng && !isGif && !isWebp) {
            throw new IllegalArgumentException("파일 내용이 이미지가 아닙니다.");
          }
        }

        String savedName = uuid + extension;

        // S3에 업로드
        S3Client s3 = getS3Client();
        s3.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(savedName)
                .contentType(mainImgFile.getContentType())
                .build(),
            RequestBody.fromInputStream(mainImgFile.getInputStream(), mainImgFile.getSize())
        );

        // S3에 저장된 이미지의 공개 URL
        String fileUrl = "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + savedName;

        imgInfo.setImageOriginName(originFileName);
        imgInfo.setImageSavedName(fileUrl); // 로컬 파일명 대신 S3 URL 저장
        imgInfo.setImageType("MAIN");

      } catch (IllegalArgumentException e) {
        throw e;
      } catch (IOException e) {
        throw new RuntimeException(e);
      }
    }

    return imgInfo;
  }

  // 다중 파일 업로드 (서브 이미지)
  public List<ProductImageDTO> multipleFileUpload(MultipartFile[] subImgs) {
    List<ProductImageDTO> list = new ArrayList<>();

    for (int i = 0; i < subImgs.length; i++) {
      ProductImageDTO dto = fileUpload(subImgs[i]);
      if (dto != null) {
        dto.setImageType("SUB");
        dto.setImageOrder(i + 1);
        list.add(dto);
      }
    }

    return list;
  }

}
