/**
 * 2: 位置情報計算処理
 */
precision mediump float;


/**
 * main
 */
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  // 現在の座標読み出し
  vec4 selfPosition = texture2D(texturePosition, uv);
  
  // 加速度
  vec4 selfVelocity = texture2D(textureVelocity, uv);

  // 移動する方向に速度を掛け合わせた数値を現在地に加える
  selfPosition.xy += selfVelocity.xy;

  // 頂点の進行方向ベクトルの更新
  selfPosition.zw = selfVelocity.zw;

  gl_FragColor = selfPosition;
}
