import {expect} from "chai";
import * as Basic from "../../../src/abap/types/basic";
import {MemoryFile} from "../../../src/files";
import {Registry} from "../../../src/registry";
import {TypedIdentifier, IdentifierMeta} from "../../../src/abap/types/_typed_identifier";
import {SyntaxLogic} from "../../../src/abap/5_syntax/syntax";
import {ABAPObject} from "../../../src/objects/_abap_object";
import {Position} from "../../../src/position";

function resolveVariable(abap: string, name: string): TypedIdentifier | undefined {
  const filename = "zfoobar.prog.abap";
  return runMulti([{filename: filename, contents: abap}], name);
}

function runMulti(files: {filename: string, contents: string}[], name: string): TypedIdentifier | undefined {
  const reg = new Registry();
  for (const file of files) {
    reg.addFile(new MemoryFile(file.filename, file.contents));
  }
  reg.parse();

  const obj = reg.getObjects()[files.length - 1] as ABAPObject;
  const filename = files[files.length - 1].filename;
  const scope = new SyntaxLogic(reg, obj).run().spaghetti.lookupPosition(new Position(1, 1), filename);
  return scope?.findVariable(name);
}

function expectStructure(identifier: TypedIdentifier | undefined) {
  expect(identifier).to.not.equals(undefined);
  expect(identifier!.getType()).to.be.instanceof(Basic.StructureType);
  const tab = identifier!.getType() as Basic.StructureType;
  return tab.getComponents();
}

function expectString(identifier: TypedIdentifier | undefined) {
  expect(identifier).to.not.equals(undefined);
  expect(identifier!.getType()).to.be.instanceof(Basic.StringType);
}

function expectVoid(identifier: TypedIdentifier | undefined) {
  expect(identifier).to.not.equals(undefined);
  expect(identifier!.getType()).to.be.instanceof(Basic.VoidType);
}

function expectTable(identifier: TypedIdentifier | undefined) {
  expect(identifier).to.not.equals(undefined);
  expect(identifier!.getType()).to.be.instanceof(Basic.TableType);
  const tab = identifier!.getType() as Basic.TableType;
  return tab.getRowType();
}

function expectInteger(identifier: TypedIdentifier | undefined) {
  expect(identifier).to.not.equals(undefined);
  expect(identifier!.getType()).to.be.instanceof(Basic.IntegerType);
}

function expectCharacter(identifier: TypedIdentifier | undefined, length: number) {
  expect(identifier).to.not.equals(undefined);
  expect(identifier!.getType()).to.be.instanceof(Basic.CharacterType);
  const type = identifier!.getType() as Basic.CharacterType;
  expect(type.getLength()).to.equal(length);
}

function expectConstantString(identifier: TypedIdentifier | undefined, value: string) {
  expectString(identifier);
  expect(identifier!.getValue()).to.equal(value);
  expect(identifier!.getMeta()).to.include(IdentifierMeta.ReadOnly);
}

function expectConstantCharacter(identifier: TypedIdentifier | undefined, value: string, length: number) {
  expectCharacter(identifier, length);
  expect(identifier!.getValue()).to.equal(value);
  expect(identifier!.getMeta()).to.include(IdentifierMeta.ReadOnly);
}

/////////////////////////////////////

describe("Syntax - Basic Types", () => {

  it("nothing", () => {
    const abap = "WRITE foobar.";
    const identifier = resolveVariable(abap, "sdf");
    expect(identifier).to.equals(undefined);
  });

  it("DATA TYPE string", () => {
    const abap = "DATA foo TYPE string.";
    const identifier = resolveVariable(abap, "foo");
    expectString(identifier);
  });

  it("DATA TYPE c", () => {
    const abap = "DATA foo TYPE c.";
    const identifier = resolveVariable(abap, "foo");
    expectCharacter(identifier, 1);
  });

  it("DATA", () => {
    const abap = "DATA foo.";
    const identifier = resolveVariable(abap, "foo");
    expectCharacter(identifier, 1);
  });

  it("DATA TYPE i", () => {
    const abap = "DATA foo TYPE i.";
    const identifier = resolveVariable(abap, "foo");
    expectInteger(identifier);
  });

  it("DATA TYPE xstring", () => {
    const abap = "DATA foo TYPE xstring.";
    const identifier = resolveVariable(abap, "foo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier!.getType()).to.be.instanceof(Basic.XStringType);
  });

  it("DATA TYPE d", () => {
    const abap = "DATA foo TYPE d.";
    const identifier = resolveVariable(abap, "foo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier!.getType()).to.be.instanceof(Basic.DateType);
  });

  it("DATA TYPE t", () => {
    const abap = "DATA foo TYPE t.";
    const identifier = resolveVariable(abap, "foo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier!.getType()).to.be.instanceof(Basic.TimeType);
  });

  it("DATA TYPE n", () => {
    const abap = "DATA foo TYPE n.";
    const identifier = resolveVariable(abap, "foo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier!.getType()).to.be.instanceof(Basic.NumericType);
  });

  it("DATA TYPE x", () => {
    const abap = "DATA foo TYPE x.";
    const identifier = resolveVariable(abap, "foo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier!.getType()).to.be.instanceof(Basic.HexType);
  });

  it("CONSTANTS TYPE string", () => {
    const abap = "CONSTANTS foo TYPE string VALUE 'sdf'.";
    const identifier = resolveVariable(abap, "foo");
    expectConstantString(identifier, "'sdf'");
  });

  it("CONSTANTS TYPE string IS INITIAL", () => {
    const abap = "CONSTANTS foo TYPE string VALUE IS INITIAL.";
    const identifier = resolveVariable(abap, "foo");
    expectConstantString(identifier, "");
  });

  it("CONSTANTS TYPE string VALUE moo", () => {
    const abap = "CONSTANTS moo TYPE string VALUE '2'.\n" +
    "CONSTANTS foo TYPE string VALUE moo.";
    const identifier = resolveVariable(abap, "foo");
    expectConstantString(identifier, "'2'");
  });

  it("CONSTANTS only value", () => {
    const abap = "CONSTANTS moo VALUE 3.";
    const identifier = resolveVariable(abap, "moo");
    expectConstantCharacter(identifier, "3", 1);
  });

  it("DATA TYPE c, length 5", () => {
    const abap = "DATA foo TYPE c LENGTH 5.";
    const identifier = resolveVariable(abap, "foo");
    expectCharacter(identifier, 5);
  });

  it("DATA TYPE c, text length", () => {
    const abap = "DATA foo TYPE c LENGTH '5'.";
    const identifier = resolveVariable(abap, "foo");
    expectCharacter(identifier, 5);
  });

  it("DATA TYPE c, text length", () => {
    const abap = "DATA foo TYPE c LENGTH `5`.";
    const identifier = resolveVariable(abap, "foo");
    expectCharacter(identifier, 5);
  });

  it("DATA TYPE c, +5", () => {
    const abap = "DATA foo TYPE c LENGTH +5.";
    const identifier = resolveVariable(abap, "foo");
    expectCharacter(identifier, 5);
  });

  it("DATA TYPE c", () => {
    const abap =
      "CONSTANTS len TYPE i VALUE 5.\n" +
      "DATA foo TYPE c LENGTH len.";
    const identifier = resolveVariable(abap, "foo");
    expectCharacter(identifier, 5);
  });

  it("DATA TYPE c, pre, 5", () => {
    const abap = "DATA foo(5) TYPE c.";
    const identifier = resolveVariable(abap, "foo");
    expectCharacter(identifier, 5);
  });

  it("table, string", () => {
    const abap = "DATA tab TYPE STANDARD TABLE OF string.";
    const identifier = resolveVariable(abap, "tab");
    const rowType = expectTable(identifier);
    expect(rowType).to.be.instanceOf(Basic.StringType);
  });

  it("table, integer", () => {
    const abap = "DATA tab TYPE STANDARD TABLE OF i.";
    const identifier = resolveVariable(abap, "tab");
    const rowType = expectTable(identifier);
    expect(rowType).to.be.instanceOf(Basic.IntegerType);
  });

  it("data with defined type", () => {
    const abap =
      "TYPES typ TYPE i.\n" +
      "DATA foo TYPE typ.";
    const identifier = resolveVariable(abap, "foo");
    expectInteger(identifier);
  });

  it("DATA structured table", () => {
    const abap = `
      TYPES: BEGIN OF foo1,
               field TYPE i,
             END OF foo1.
      DATA tab TYPE STANDARD TABLE OF foo1 WITH EMPTY KEY.`;
    const type = resolveVariable(abap, "tab");
    const rowType = expectTable(type);
    expect(rowType).to.be.instanceof(Basic.StructureType);
    const stru = rowType as Basic.StructureType;
    const components = stru.getComponents();
    expect(components.length).to.equal(1);
    expect(components[0].name).to.equal("field");
  });

  it("ref to object", () => {
    const abap = `
    CLASS lcl_class DEFINITION.
    ENDCLASS.
    CLASS lcl_class IMPLEMENTATION.
    ENDCLASS.
    DATA lo_class TYPE REF TO lcl_class.`;
    const type = resolveVariable(abap, "lo_class");
    expect(type).to.not.equal(undefined);
    expect(type!.getType()).to.be.instanceof(Basic.ObjectReferenceType);
  });

  it("ref to object, unknown", () => {
    const abap = `
    DATA lo_class TYPE REF TO lcl_sdfsdsdf.`;
    const type = resolveVariable(abap, "lo_class");
    expect(type).to.not.equal(undefined);
    expect(type!.getType()).to.be.instanceof(Basic.UnknownType);
  });

  it("ref to interface", () => {
    const abap = `
    INTERFACE lif_foo.
    ENDINTERFACE.
    DATA li_intf TYPE REF TO lif_foo.`;
    const type = resolveVariable(abap, "li_intf");
    expect(type).to.not.equal(undefined);
    expect(type!.getType()).to.be.instanceof(Basic.ObjectReferenceType);
  });

  it("ref to global class", () => {
    const clas = `
      CLASS zcl_global DEFINITION PUBLIC.
      ENDCLASS.
      CLASS zcl_global IMPLEMENTATION.
      ENDCLASS.`;
    const prog = `DATA lo_class TYPE REF TO zcl_global.`;
    const type = runMulti(
      [{filename: "zcl_global.clas.abap", contents: clas},
        {filename: "zfoobar.prog.abap", contents: prog}],
      "lo_class");
    expect(type).to.not.equal(undefined);
    expect(type!.getType()).to.be.instanceof(Basic.ObjectReferenceType);
  });

  it("DATA abap_bool", () => {
    const abap = "DATA foo TYPE abap_bool.";
    const identifier = resolveVariable(abap, "foo");
    expectCharacter(identifier, 1);
  });

  it("DDIC data element", () => {
    const clas = `
<?xml version="1.0" encoding="utf-8"?>
<abapGit version="v1.0.0" serializer="LCL_OBJECT_DTEL" serializer_version="v1.0.0">
 <asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
  <asx:values>
   <DD04V>
    <ROLLNAME>ZDDIC</ROLLNAME>
    <DDLANGUAGE>E</DDLANGUAGE>
    <DATATYPE>CHAR</DATATYPE>
    <LENG>000002</LENG>
    <OUTPUTLEN>000002</OUTPUTLEN>
   </DD04V>
  </asx:values>
 </asx:abap>
</abapGit>`;
    const prog = `DATA foo TYPE zddic.`;
    const type = runMulti(
      [{filename: "zddic.dtel.xml", contents: clas},
        {filename: "zfoobar.prog.abap", contents: prog}],
      "foo");
    expectCharacter(type, 2);
  });

  it("structured DATA, BEGIN OF", () => {
    const abap = `
    DATA: BEGIN OF foo,
      bar TYPE i,
    END OF foo.`;

    const identifier = resolveVariable(abap, "foo");
    const components = expectStructure(identifier);
    expect(components.length).to.equal(1);
    expect(components[0].name).to.equal("bar");
  });

  it("structured CONSTANTS, BEGIN OF", () => {
    const abap = `
    CONSTANTS:
      BEGIN OF bar,
        foo TYPE c LENGTH 1 VALUE 'a',
      END OF bar.`;

    const identifier = resolveVariable(abap, "bar");
    const components = expectStructure(identifier);
    expect(components.length).to.equal(1);
    expect(components[0].name).to.equal("foo");
  });

  it("structured CONSTANTS, BEGIN OF, nested", () => {
    const abap = `
    CONSTANTS:
      BEGIN OF bar,
        BEGIN OF loo,
          foo TYPE c LENGTH 1 VALUE 'a',
        END OF loo,
      END OF bar.`;

    const identifier = resolveVariable(abap, "bar");
    const components = expectStructure(identifier);
    expect(components.length).to.equal(1);
    expect(components[0].name).to.equal("loo");
  });

  it("structured DATA, BEGIN OF, nested", () => {
    const abap = `
    DATA:
      BEGIN OF foo,
        BEGIN OF bar,
          f TYPE string,
        END OF bar,
      END OF foo.`;

    const identifier = resolveVariable(abap, "foo");
    const components = expectStructure(identifier);
    expect(components.length).to.equal(1);
    expect(components[0].name).to.equal("bar");
  });

  it("Basic void", () => {
    const abap = "DATA foo TYPE void_type.";
    const identifier = resolveVariable(abap, "foo");
    expectVoid(identifier);
  });

  it("Basic void, LIKE LINE OF", () => {
    const abap = `
DATA: lt_keys TYPE void_something,
      ls_key  LIKE LINE OF lt_keys.`;
    const identifier = resolveVariable(abap, "ls_key");
    expectVoid(identifier);
  });

  it("LIKE LINE OF, error", () => {
    const abap = `
DATA: lt_keys TYPE i,
      ls_key  LIKE LINE OF lt_keys.`;  // "i" not a table type
    const identifier = resolveVariable(abap, "ls_key");
    expect(identifier?.getType()).to.be.instanceof(Basic.UnknownType);
  });

  it("LIKE LINE OF, i", () => {
    const abap = `
DATA: lt_keys TYPE STANDARD TABLE OF i,
      ls_key  LIKE LINE OF lt_keys.`;
    const identifier = resolveVariable(abap, "ls_key");
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("LIKE, i", () => {
    const abap = `
DATA: lv_i TYPE i,
      lv_foo LIKE lv_i.`;
    const identifier = resolveVariable(abap, "lv_foo");
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("LIKE, error", () => {
    const abap = `DATA: lv_foo LIKE lv_sdfsdsdfsdf.`;
    const identifier = resolveVariable(abap, "lv_foo");
    expect(identifier?.getType()).to.be.instanceof(Basic.UnknownType);
  });

  it("basic field symbol", () => {
    const abap = `FIELD-SYMBOLS <foo> TYPE i.`;
    const identifier = resolveVariable(abap, "<foo>");
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("basic PARAMETER", () => {
    const abap = `PARAMETERS p_max TYPE i OBLIGATORY DEFAULT 100.`;
    const identifier = resolveVariable(abap, "p_max");
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("basic FORM", () => {
    const abap = `FORM select CHANGING import TYPE i.
ENDFORM.`;
    const identifier = resolveVariable(abap, "import");
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("FORM, ref to unknown", () => {
    const abap = `FORM output_integer USING io_value TYPE REF TO zcl_abappgp_integer.
ENDFORM.`;
    const identifier = resolveVariable(abap, "io_value");
    expect(identifier?.getType()).to.be.instanceof(Basic.UnknownType);
  });

  it("reference type defined in local class", () => {
    const abap = `CLASS lcl_foo DEFINITION.
  PUBLIC SECTION.
    TYPES: ty_foo TYPE i.
ENDCLASS.
DATA foobar TYPE lcl_foo=>ty_foo.`;
    const identifier = resolveVariable(abap, "foobar");
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("reference type defined in local interface", () => {
    const abap = `INTERFACE lif_foo.
  TYPES: ty_foo TYPE i.
ENDINTERFACE.
DATA foobar TYPE lif_foo=>ty_foo.`;
    const identifier = resolveVariable(abap, "foobar");
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("Something sub of void should be void", () => {
    const abap = `DATA lt_components TYPE cl_abap_structdescr=>component_table.`;
    const identifier = resolveVariable(abap, "lt_components");
    expect(identifier?.getType()).to.be.instanceof(Basic.VoidType);
  });

  it("void object reference", () => {
    const abap = `DATA lo_table TYPE REF TO cl_abap_tabledescr.`;
    const identifier = resolveVariable(abap, "lo_table");
    expect(identifier?.getType()).to.be.instanceof(Basic.VoidType);
  });

  it("object reference, interface, error expected", () => {
    const abap = `DATA: mi_ixml TYPE REF TO zif_ixml.`;
    const identifier = resolveVariable(abap, "mi_ixml");
    expect(identifier?.getType()).to.be.instanceof(Basic.UnknownType);
  });

  it("reference like defined in local class", () => {
    const abap = `CLASS lcl_foo DEFINITION.
  PUBLIC SECTION.
    DATA: foo TYPE i.
ENDCLASS.
DATA foobar LIKE lcl_foo=>foo.`;
    const identifier = resolveVariable(abap, "foobar");
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("data type table of void structure", () => {
    const abap = `
      TYPES ty_structures_tt TYPE STANDARD TABLE OF sstruc WITH NON-UNIQUE DEFAULT KEY.
      DATA foo TYPE ty_structures_tt.`;
    const identifier = resolveVariable(abap, "foo");
    expect(identifier?.getType()).to.be.instanceof(Basic.TableType);
  });

  it("TYPE TABLE OF REF TO", () => {
    const abap = `
CLASS lcl_foo DEFINITION.
ENDCLASS.
CLASS lcl_foo IMPLEMENTATION.
ENDCLASS.
DATA lt_nodes TYPE TABLE OF REF TO lcl_foo.`;
    const identifier = resolveVariable(abap, "lt_nodes");
    expect(identifier).to.not.equal(undefined);
    expect(identifier!.getType()).to.be.instanceof(Basic.TableType);
  });

  it("basic SELECT-OPTIONS", () => {
    const abap = `
TABLES: rsdswhere.
SELECT-OPTIONS s_dyn FOR rsdswhere-line.`;
    const identifier = resolveVariable(abap, "s_dyn");
    expect(identifier).to.not.equal(undefined);
    expect(identifier!.getType()).to.be.instanceof(Basic.TableType);
    const rowType = (identifier!.getType() as Basic.TableType).getRowType();
    expect(rowType).to.be.instanceof(Basic.VoidType);
  });

  it("LIKE LINE OF sub field", () => {
    const abap = `
TYPES: BEGIN OF ty_struc,
         piecelist TYPE STANDARD TABLE OF i WITH DEFAULT KEY,
       END OF ty_struc.
DATA: ls_struc TYPE ty_struc,
      lv_bar   LIKE LINE OF ls_struc-piecelist.`;
    const identifier = resolveVariable(abap, "lv_bar");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("ms_metadata", () => {
    const abap = `DATA ms_metadata TYPE zif_abapgit_definitions=>ty_metadata.`;
    const identifier = resolveVariable(abap, "ms_metadata");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.UnknownType);
  });

  it("TYPE any", () => {
    const abap = `DATA properties TYPE any.`;
    const identifier = resolveVariable(abap, "properties");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.AnyType);
  });

  it("LIKE sy", () => {
    const abap = `DATA sdf LIKE sy.`;
    const identifier = resolveVariable(abap, "sdf");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.StructureType);
  });

  it("nested", () => {
    const abap = `TYPES: BEGIN OF ty_type1,
  type1 TYPE i,
END OF ty_type1.
TYPES: BEGIN OF ty_type2,
  type2 TYPE ty_type1,
END OF ty_type2.
DATA foo TYPE ty_type2-type2-type1.`;
    const identifier = resolveVariable(abap, "foo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("nested, with interface", () => {
    const abap = `INTERFACE lif_interface.
  TYPES: BEGIN OF ty_type1,
           type1 TYPE i,
         END OF ty_type1.
  TYPES: BEGIN OF ty_type2,
           type2 TYPE ty_type1,
         END OF ty_type2.
ENDINTERFACE.
DATA foo TYPE lif_interface=>ty_type2-type2-type1.`;
    const identifier = resolveVariable(abap, "foo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("expect void", () => {
    const abap = `DATA lv_button1 TYPE svalbutton-buttontext.`;
    const identifier = resolveVariable(abap, "lv_button1");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.VoidType);
  });

  it("LIKE STANDARD TABLE", () => {
    const abap = `
      DATA boo TYPE i.
      DATA foo LIKE STANDARD TABLE OF boo.`;
    const identifier = resolveVariable(abap, "foo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.TableType);
    const row = (identifier!.getType() as Basic.TableType).getRowType();
    expect(row).to.be.instanceof(Basic.IntegerType);
  });

  it("TYPE RANGE OF", () => {
    const abap = `DATA lt_range TYPE RANGE OF devclass.`;
    const identifier = resolveVariable(abap, "lt_range");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.TableType);
  });

  it("Field symbol TYPE LINE OF", () => {
    const abap = `
    TYPES: ty_foo TYPE STANDARD TABLE OF i.
    FIELD-SYMBOLS <bar> TYPE LINE OF ty_foo.`;
    const identifier = resolveVariable(abap, "<bar>");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("LIKE from super class", () => {
    const abap = `
CLASS lcl_super DEFINITION.
  PUBLIC SECTION.
    DATA: foo TYPE i.
ENDCLASS.
CLASS lcl_super IMPLEMENTATION.
ENDCLASS.

CLASS lcl_sub DEFINITION INHERITING FROM lcl_super.
  PUBLIC SECTION.
    DATA: bar LIKE foo.
ENDCLASS.
CLASS lcl_sub IMPLEMENTATION.
ENDCLASS.

DATA moo LIKE lcl_sub=>bar.`;
    const identifier = resolveVariable(abap, "moo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("LIKE, internal class definition", () => {
    const abap = `
CLASS lcl_sub DEFINITION.
  PUBLIC SECTION.
    DATA foo TYPE i.
    DATA bar LIKE foo.
ENDCLASS.
CLASS lcl_sub IMPLEMENTATION.
ENDCLASS.

DATA moo LIKE lcl_sub=>bar.`;
    const identifier = resolveVariable(abap, "moo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("TYPE from super class", () => {
    const abap = `
  CLASS lcl_super DEFINITION.
    PUBLIC SECTION.
      TYPES: ty_foo TYPE i.
  ENDCLASS.
  CLASS lcl_super IMPLEMENTATION.
  ENDCLASS.

  CLASS lcl_sub DEFINITION INHERITING FROM lcl_super.
    PUBLIC SECTION.
      DATA: bar TYPE ty_foo.
  ENDCLASS.
  CLASS lcl_sub IMPLEMENTATION.
  ENDCLASS.

  DATA moo LIKE lcl_sub=>bar.`;
    const identifier = resolveVariable(abap, "moo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("TYPE from super super class", () => {
    const abap = `
CLASS lcl_supersuper DEFINITION.
  PUBLIC SECTION.
    TYPES: ty_foo TYPE i.
ENDCLASS.
CLASS lcl_supersuper IMPLEMENTATION.
ENDCLASS.

CLASS lcl_super DEFINITION INHERITING FROM lcl_supersuper.
ENDCLASS.
CLASS lcl_super IMPLEMENTATION.
ENDCLASS.

CLASS lcl_sub DEFINITION INHERITING FROM lcl_super.
  PUBLIC SECTION.
    DATA: bar TYPE ty_foo.
ENDCLASS.
CLASS lcl_sub IMPLEMENTATION.
ENDCLASS.

DATA moo LIKE lcl_sub=>bar.`;
    const identifier = resolveVariable(abap, "moo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("TYPE REF TO data", () => {
    const abap = `
TYPES:
  BEGIN OF ty_named_collection,
    name TYPE string,
  END OF ty_named_collection.
DATA lr_collection TYPE REF TO ty_named_collection.`;
    const identifier = resolveVariable(abap, "lr_collection");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.DataReference);
  });

  it("SELECTION-SCREEN TITLE", () => {
    const abap = `
  SELECTION-SCREEN BEGIN OF SCREEN 1002 TITLE s_title.
  SELECTION-SCREEN END OF SCREEN 1002.
  s_title = 'abc'.`;
    const identifier = resolveVariable(abap, "s_title");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.CharacterType);
  });

  it("LIKE LINE OF lo_node->", () => {
    const abap = `
CLASS lcl_node DEFINITION.
  PUBLIC SECTION.
    DATA: mt_edges TYPE STANDARD TABLE OF i.
ENDCLASS.
CLASS lcl_node IMPLEMENTATION.
ENDCLASS.
DATA: lo_node TYPE REF TO lcl_node,
      lv_edge LIKE LINE OF lo_node->mt_edges.`;
    const identifier = resolveVariable(abap, "lv_edge");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.IntegerType);
  });

  it("LIKE LINE OF lo_node->, but void", () => {
    const abap = `
DATA: lo_node TYPE REF TO cl_void,
      lv_edge LIKE LINE OF lo_node->mt_edges.`;
    const identifier = resolveVariable(abap, "lv_edge");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.VoidType);
  });

  it("INTERFACE DEFERRED", () => {
    const abap = `
INTERFACE lif_foo DEFERRED.
DATA foo TYPE REF TO lif_foo.
INTERFACE lif_foo.
ENDINTERFACE.`;
    const identifier = resolveVariable(abap, "foo");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.ObjectReferenceType);
  });

  it("CLASS DEFERRED", () => {
    const abap = `
CLASS lcl_bar DEFINITION DEFERRED.
DATA bar TYPE REF TO lcl_bar.
CLASS lcl_bar DEFINITION.
ENDCLASS.
CLASS lcl_bar IMPLEMENTATION.
ENDCLASS.`;
    const identifier = resolveVariable(abap, "bar");
    expect(identifier).to.not.equal(undefined);
    expect(identifier?.getType()).to.be.instanceof(Basic.ObjectReferenceType);
  });

});