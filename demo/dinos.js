import {ProseMirror, defineOption, Keymap} from "../src/edit"
import {nodeTypes, NodeType, Span} from "../src/model"
import {render as renderDOM} from "../src/convert/to_dom"
import {tags as parseTags} from "../src/convert/from_dom"
import {registerItem, MenuItem} from "../src/menu/items"
import {elt} from "../src/dom"
import {addInputRules, Rule} from "../src/inputrules/inputrules"
import {Tooltip} from "../src/menu/tooltip"
import "../src/menu/menubar"
import "../src/inputrules/autoinput"
import {fromDOM} from "../src/convert/from_dom"

const dinos = ["brontosaurus", "stegosaurus", "triceratops", "tyrannosaurus", "pterodactyl"]

nodeTypes.dino = new NodeType({name: "dino", type: "span", defaultAttrs: {type: "brontosaurus"}})

// NOTE: The code below, which defines a serializer and parser for the
// dino type to the DOM format, is ad-hoc and hacky because no proper
// API for such extensions exists yet.

renderDOM.dino = node => elt("img", {"dino-type": node.attrs.type,
                                     class: "dinosaur",
                                     src: "dino/" + node.attrs.type + ".png",
                                     title: node.attrs.type})

let oldImg = parseTags.img
parseTags.img = (dom, context) => {
  if (dom.className == "dinosaur") context.insert(new Span("dino", {type: dom.getAttribute("dino-type")}))
  else return oldImg(dom, context)
}

class DinoItem extends MenuItem {
  constructor(image, action) {
    super()
    this.image = image
    this.action = action
  }
  select(pm) { return pm.getOption("dinos") }
  render(menu) {
    let button = elt("img", {src: "dino/" + this.image + ".png", class: "dinoicon", title: "Insert dinosaur"})
    button.addEventListener("mousedown", e => {
      e.preventDefault(); e.stopPropagation()
      menu.run(this.action(menu.pm))
    })
    return button
  }
}
let dinoItems = dinos.map(name => new DinoItem(name, pm => insertDino(pm, name)))
registerItem("inline", new DinoItem("brontosaurus", () => dinoItems))

function insertDino(pm, name) {
  pm.apply(pm.tr.insertInline(pm.selection.head, new Span("dino", {type: name})))
}

defineOption("dinos", false)