package com.farmtech.smartfarm.product.service;

import com.farmtech.smartfarm.product.dto.ProductCategoryDTO;
import com.farmtech.smartfarm.product.dto.ProductDTO;
import com.farmtech.smartfarm.product.dto.ProductImageDTO;
import com.farmtech.smartfarm.product.dto.ProductListDTO;
import com.farmtech.smartfarm.product.mapper.ProductMapper;
import com.farmtech.smartfarm.util.UploadUtil;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class ProductService {
  private final ProductMapper productMapper;
  private final UploadUtil uploadUtil;

  // 상품 + 이미지 등록
  @Transactional
  public void insertProduct(ProductDTO productDTO, List<ProductImageDTO> imgList) {
    // 1. 상품 INSERT → DB AUTO_INCREMENT ID가 productDTO.productId에 자동 주입됨
    productMapper.insertProduct(productDTO);

    // 2. 생성된 productId를 이미지 리스트에 세팅
    for (ProductImageDTO img : imgList) {
      img.setProductId(productDTO.getProductId());
    }

    // 3. 이미지 INSERT
    productMapper.insertImage(imgList);
  }

  // 카테고리 조회
  public List<ProductCategoryDTO> selectCategory(){
    return productMapper.selectCategory();
  }

  // 상품 목록 조회
  public List<ProductListDTO> getProductList(String sort, String keyword, Integer categoryId) {
    return productMapper.selectProductList(sort, keyword, categoryId);
  }

  // 상품 상세 조회 기능
  public ProductDTO getProductDetail(int productId){
    return productMapper.getProductDetail(productId);
  }

  // 상품 목록 조회(매니저)
  public Map<String, Object> selectProductListManager(Integer categoryId, String status, String keyword, int page, int size){
    int offset = page * size;

    Map<String, Object> params = new HashMap<>();
    params.put("categoryId", categoryId);
    params.put("status",     status);
    params.put("keyword",    keyword);
    params.put("size",       size);
    params.put("offset",     offset);

    List<ProductListDTO> content = productMapper.selectProductListManager(params);
    int totalCount = productMapper.countProductListManager(params);

    Map<String, Object> result = new HashMap<>();
    result.put("content",    content);
    result.put("totalCount", totalCount);
    result.put("totalPages", (int) Math.ceil((double) totalCount / size));

    return result;
  }

  // 상품 수정
  @Transactional
  public void updateProduct(ProductDTO productDTO) {
    // 텍스트 정보 항상 업데이트
    productMapper.updateProduct(productDTO);

    // 대표 이미지 (선택했을 때만)
    if(productDTO.getMainImgUrl() != null){
      productMapper.deleteProductImageByType(productDTO.getProductId(),"MAIN");
      ProductImageDTO main = new ProductImageDTO();
      main.setProductId(productDTO.getProductId());
      main.setImageType("MAIN");
      main.setImageSavedName(productDTO.getMainImgUrl());
      main.setImageOriginName(productDTO.getMainImgUrl());
      productMapper.insertImage(List.of(main));
    }

    // 서브 이미지 (선택했을 때만 -> 삭제)
    if (productDTO.getDeleteImgIds() != null){
      for(int id : productDTO.getDeleteImgIds()){
        productMapper.deleteProductImageById(id);
      }
    }
    // 서브 이미지 (새로 INSERT)
    if (productDTO.getSubImgUrls() != null){
      int order = 1;
      List<ProductImageDTO> subs = new ArrayList<>();
      for (String url : productDTO.getSubImgUrls()){
        ProductImageDTO subimg = new ProductImageDTO();
        subimg.setProductId(productDTO.getProductId());
        subimg.setImageOrder(order++);
        subimg.setImageType("SUB");
        subimg.setImageSavedName(url);
        subimg.setImageOriginName(url);
        subs.add(subimg);
      }
      productMapper.insertImage(subs);
    }

    // 상세 페이지 이미지 (선택했을 때만)
    if (productDTO.getDetailImgUrl() != null){
      productMapper.deleteProductImageByType(productDTO.getProductId(),"DETAIL");
      ProductImageDTO detailImg = new ProductImageDTO();
      detailImg.setProductId(productDTO.getProductId());
      detailImg.setImageType("DETAIL");
      detailImg.setImageOriginName(productDTO.getDetailImgUrl());
      detailImg.setImageSavedName(productDTO.getDetailImgUrl());
      productMapper.insertImage(List.of(detailImg));
    }
  }
  // 상품 삭제
  @Transactional
  public void deleteProduct(int productId){
    productMapper.deleteProduct(productId);       // 상품 삭제
  }

// 검색어 추천
  public List<String> getRecommendedKeywords() {
    return productMapper.selectRecommendedKeywords();
  }
}
