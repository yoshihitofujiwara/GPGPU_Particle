/**
 * 1: 移動計算用
 */
precision mediump float;

uniform bool mouseFlag;
uniform vec2 mouse;
uniform float velocity;
const float SPEED = 0.07;

/**
 * main
 */
void main() {
  vec2 p = gl_FragCoord.xy / resolution;

  // 前フレームの座標読み出し
  vec4 t = texture2D(texturePosition, p);

  // カーソル位置へのベクトル
  vec2 v = normalize(mouse - t.xy) * 0.2;

  // ハーフベクトルで向きを補正
  vec2 w = normalize(v + t.zw);

  // XY が頂点の座標を、ZW で頂点の進行方向ベクトルを表している
  vec4 destColor = vec4(w * SPEED * velocity, w);

  // ドラッグされてない場合は前回の進行方向を維持する
  // if(!mouseFlag){destColor.zw = t.zw;}

  gl_FragColor = destColor;
}
