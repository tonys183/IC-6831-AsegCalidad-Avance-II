import unittest
from zerver.lib.test_classes import ZulipTestCase
from xml.etree.ElementTree import Element, SubElement
from copy import deepcopy
from xml.etree.ElementTree import tostring

import markdown

from zerver.lib.markdown.nested_code_blocks import (
    NestedCodeBlocksRendererTreeProcessor,
)
from zerver.lib.markdown import walk_tree_with_family


# test made by: Saúl Pacheco Cubillo
class NestedCodeBlocksTests(ZulipTestCase):

    def setUp(self) -> None:
        super().setUp()
        mrkdwn = markdown.Markdown()
        self.processor = NestedCodeBlocksRendererTreeProcessor(mrkdwn, {})

    def test_is_code_tag(self) -> None:
        code_element = Element("code")
        code_element.text = "test"
        result = self.processor.get_code_tags(code_element)
        self.assertEqual(result, ("code", "test"))

    def test_is_non_code_tag(self) -> None:
        div_element = Element("xyz")
        result = self.processor.get_code_tags(div_element)
        self.assertIsNone(result)

    def test_replace_element_found(self) -> None:
        parent = Element("ul")
        target = Element("li")
        parent.append(target)
        new_element = Element("span")
        self.processor.replace_element(parent, new_element, target)
        children = list(parent)
        self.assertListEqual(children, [new_element])

    def test_run_no_nested_blocks(self) -> None:
        root = Element("div")
        ul = SubElement(root, "ul")
        li = SubElement(ul, "li")
        p = SubElement(li, "p")
        p.text = "text"
        unmodified_tree = deepcopy(root)
        self.processor.run(root)
        self.assertEqual(tostring(root), tostring(unmodified_tree))

    def test_run_with_nested_block(self) -> None:
        root = Element("div")
        ul = SubElement(root, "ul")
        li = SubElement(ul, "li")
        p = SubElement(li, "p")
        code = SubElement(p, "code")
        code.text = "code"
        self.processor.run(root)
        li_children = list(li)
        has_codehilite = all((child.tag == "div" and child.get("class") == "codehilite") for child in li_children)
        self.assertTrue(has_codehilite)
