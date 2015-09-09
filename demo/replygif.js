import {ProseMirror, defineOption, Keymap} from "../src/edit"
import {nodeTypes, NodeType, Span} from "../src/model"
import {render as renderDOM} from "../src/convert/to_dom"
import {tags as parseTags} from "../src/convert/from_dom"
import {registerItem, MenuItem, IconItem} from "../src/menu/items"
import {elt} from "../src/dom"
import {addInputRules, Rule} from "../src/inputrules/inputrules"
import {Tooltip} from "../src/menu/tooltip"
import insertCSS from "insert-css"
import "../src/menu/menubar"
import "../src/inputrules/autoinput"

function ajaxGet(url, success, errback){
  var httpRequest;
  if (window.XMLHttpRequest) { // Mozilla, Safari, IE7+ ...
      httpRequest = new XMLHttpRequest();
  } else if (window.ActiveXObject) { // IE 6 and older
      httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
  }

  httpRequest.open('GET', url, true);
  httpRequest.onreadystatechange = function(){
    if (httpRequest.readyState === 4) {
    // everything is good, the response is received
      if (httpRequest.status === 200) {
          success(JSON.parse(httpRequest.responseText));
      } else {
        console && console.error && console.error("Request to " + url + "failed: " + httpRequest.status)
        errback(httpRequest)
      }
    }
  }
  httpRequest.send(null);

}


class AjaxItems extends MenuItem {
  createItem(){ throw "You need to implement this"}
  targetUrl(){ throw "You need to implement this"}
  fetch(cb){
    if (this.items && this.items.length) return cb();
    this.loading = true;
    ajaxGet(this.targetUrl(), function(sourceItems){
        this.items = sourceItems.map(e=>this.createItem(e))
        this.loading = false;
        cb();
      }.bind(this)
    )
  }
  render(menu) {
    let button = this.button();
    button.addEventListener("mousedown", e => {
      e.preventDefault(); e.stopPropagation()
      this.fetch(e=>{
        menu.run(this.items)
      })
    })
    return button
  }
}

class GifItem extends MenuItem {
  constructor(gif) {
    super()
    this.image = gif.file;
    this.thumbnail = gif.file.replace('/i/', "/thumbnail/");
    this.title = gif["caption"];
  }
  render(menu) {
    let button = elt("img", {class: "ProseMirror-replygif-gif", src: this.thumbnail, title: this.title})
    let over = button.addEventListener("mouseover", e => {
      button.src = this.image;
    })
    button.addEventListener("mousedown", e => {
      e.preventDefault(); e.stopPropagation()
      menu.run(this.insert(menu.pm))
    })
    return button
  }
  insert(pm, name) {
    pm.apply(pm.tr.insertInline(pm.selection.head,
              new Span("image", {src: this.image,
                                 alt: this.title,
                                 title: this.title}, null, null)))
  }
}


class TagItem extends AjaxItems {
  constructor(itemCtx){
    super()
    this.tag = itemCtx.title;
  }
  createItem(e){
    return new GifItem(e);
  }
  targetUrl(){
    return "http://replygif.net/api/gifs?api-key=39YAprx5Yi&tag=" + this.tag;
  }
  button() {
    return elt("span", {class: "ProseMirror-replgif-tag"}, this.tag);
  }
}

class ReplyGifItem extends AjaxItems {
  createItem(e){
    return new TagItem(e);
  }
  constructor() {
    super()
    this.tags = false;
  }
  targetUrl(){
    return "http://replygif.net/api/tags?api-key=39YAprx5Yi&reaction=1";
  }
  select(pm) { return pm.getOption("replygif") }
  button() {
    return elt("span", {}, "ReplyGif");
  }
}
registerItem("inline", new ReplyGifItem())

defineOption("replygif", false)



insertCSS(`
img.ProseMirror-replygif-gif {
  display: inline;
  margin: 2px;
  height: 3.5em;
  float: left;
}

.ProseMirror-replgif-tag {
  display: inline;
  padding: 3px;
  margin: 2px;
  float: left;
  background: #eee;
}


`)