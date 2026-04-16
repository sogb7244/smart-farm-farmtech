package com.farmtech.smartfarm.product.mapper;

import com.farmtech.smartfarm.product.dto.ProductCategoryDTO;
import com.farmtech.smartfarm.product.dto.ProductDTO;
import com.farmtech.smartfarm.product.dto.ProductImageDTO;
import com.farmtech.smartfarm.product.dto.ProductListDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ProductMapper {

  // 상품 등록 (useGeneratedKeys로 생성된 ID가 productDTO.productId에 자동 주입됨)
  void insertProduct(ProductDTO productDTO);

  // 상품 이미지 등록
  void insertImage(@Param("imgList") List<ProductImageDTO> imgList);

  // 상품 카테고리 조회
  List<ProductCategoryDTO> selectCategory();

  // 상품 목록 조회
  List<ProductListDTO> selectProductList(@Param("sort") String sort, @Param("keyword") String keyword, @Param("categoryId") Integer categoryId);

  // 상세 상품 조회 메서드
  ProductDTO getProductDetail(int productId);

  /// 매니저 ///

  // 상품 목록 조회
  List<ProductListDTO> selectProductListManager(Map<String, Object> params);

  // 상품 목록 카운트
  int countProductListManager(Map<String, Object> params);

  // 상품 수정
  void updateProduct(ProductDTO productDTO);

  // 상품 삭제
  void deleteProduct(int productId);
  void deleteProductImage(int productId);

  // 상품 이미지 업데이트
  void updateProductImage(@Param("img") ProductImageDTO img);

  void deleteProductImageByType(@Param("productId") int productId,
                                @Param("imageType") String imageType);

  // 이미지 단건 삭제
  void deleteProductImageById(@Param("imageId") int imageId);

  /// Gemini ///
  ///
  // 재고가 있는 전체 활성 상품 목록 조회 (AI 매칭용)
  // productId와 productName만 가져와 Gemini 프롬프트에 포함시킨다.
  List<ProductListDTO> selectActiveProducts();


//  검색어 추천
  List<String> selectRecommendedKeywords();


}
