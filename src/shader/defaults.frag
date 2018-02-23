/**
 * 4: 頂点シェーダから受け取った情報を元に色情報を追加
 */
precision mediump float;

varying vec4 v_color;

/**
 * main
 */
void main() {
  gl_FragColor = v_color;
}
