var KeyCode={
  BackSpace : 8,
  Tab : 9,
  Enter : 13,
  Shift : 16,
  Ctrl : 17,
  Alt : 18,
  Pause : 19,
  Break : 19,
  CapsLock : 20,
  Esc : 27,
  PageUp : 33,
  PageDown : 34,
  End : 35,
  Home : 36,
  Left : 37,
  Up : 38,
  Right : 39,
  Down : 40,
  Insert : 45,
  Delete : 46,
  0 : 48,
  1 : 49,
  2 : 50,
  3 : 51,
  4 : 52,
  5 : 53,
  6 : 54,
  7 : 55,
  8 : 56,
  9 : 57,
  a : 65,
  b : 66,
  c : 67,
  d : 68,
  e : 69,
  f : 70,
  g : 71,
  h : 72,
  i : 73,
  j : 74,
  k : 75,
  l : 76,
  m : 77,
  n : 78,
  o : 79,
  p : 80,
  q : 81,
  r : 82,
  s : 83,
  t : 84,
  u : 85,
  v : 86,
  w : 87,
  x : 88,
  y : 89,
  z : 90,
  Windows : 91,
  RightClick : 92,
  F1 : 112,
  F2 : 113,
  F3 : 114,
  F4 : 115,
  F5 : 116,
  F6 : 117,
  F7 : 118,
  F8 : 119,
  F9 : 120,
  F10 : 121,
  F11 : 122,
  F12 : 123,
  NumLock : 144,
  ScrollLock : 145
};
var Key={
  BackSpace : 0,
  Tab : 0,
  Enter : 0,
  Shift : 0,
  Ctrl : 0,
  Alt : 0,
  Pause : 0,
  Break : 0,
  CapsLock : 0,
  Esc : 0,
  PageUp : 0,
  PageDown : 0,
  End : 0,
  Home : 0,
  Left : 0,
  Up : 0,
  Right : 0,
  Down : 0,
  Insert : 0,
  Delete : 0,
  0 : 0,
  1 : 0,
  2 : 0,
  3 : 0,
  4 : 0,
  5 : 0,
  6 : 0,
  7 : 0,
  8 : 0,
  9 : 0,
  a : 0,
  b : 0,
  c : 0,
  d : 0,
  e : 0,
  f : 0,
  g : 0,
  h : 0,
  i : 0,
  j : 0,
  k : 0,
  l : 0,
  m : 0,
  n : 0,
  o : 0,
  p : 0,
  q : 0,
  r : 0,
  s : 0,
  t : 0,
  u : 0,
  v : 0,
  w : 0,
  x : 0,
  y : 0,
  z : 0,
  Windows : 0,
  RightClick : 0,
  F1 : 0,
  F2 : 0,
  F3 : 0,
  F4 : 0,
  F5 : 0,
  F6 : 0,
  F7 : 0,
  F8 : 0,
  F9 : 0,
  F10 : 0,
  F11 : 0,
  F12 : 0,
  NumLock : 0,
  ScrollLock : 0
};
var mouse={
  x:0,
  y:0,
  click:0
};
window.addEventListener('mousemove',function(e){
  mouse.x=e.x;
  mouse.y=e.y;
});
$(document).click(function (evt) {
  mouse.click=1;
})
$(document).keydown(function(e) {
  for (var i = 0; i < Object.keys(Key).length; i++) {
    if (e.keyCode==KeyCode[Object.keys(KeyCode)[i]]) {
      Key[Object.keys(KeyCode)[i]]=1;
    }
  }
}).keyup(function(e) {
  for (var i = 0; i < Object.keys(Key).length; i++) {
    if (e.keyCode==KeyCode[Object.keys(KeyCode)[i]]) {
      Key[Object.keys(KeyCode)[i]]=0;
    }
  }
});
window.addEventListener('mousemove',function(e){
  mouse.x=e.x;
  mouse.y=e.y;
});
$(document).click(function (evt) {
  mouse.click=1;
})
$(document).keydown(function(e) {
  for (var i = 0; i < Object.keys(Key).length; i++) {
    if (e.keyCode==KeyCode[Object.keys(KeyCode)[i]]) {
      Key[Object.keys(KeyCode)[i]]=1;
    }
  }
}).keyup(function(e) {
 for (var i = 0; i < Object.keys(Key).length; i++) {
   if (e.keyCode==KeyCode[Object.keys(KeyCode)[i]]) {
     Key[Object.keys(KeyCode)[i]]=0;
   }
 }
});
