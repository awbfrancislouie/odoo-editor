"use strict";

import {
    BasicEditor,
    deleteBackward,
    deleteForward,
    insertLineBreak,
    insertParagraphBreak,
    testEditor,
    testVdom,
    toggleBold,
} from './utils.js';

describe('Editor', () => {
    describe('deleteForward', () => {
        describe('Selection collapsed', () => {
            describe('Basic', () => {
                it('should do nothing', async () => {
                    // TODO the addition of <br/> "correction" part was judged
                    // unnecessary to enforce, the rest of the test still makes
                    // sense: not removing the unique <p/> and keeping the
                    // cursor at the right place.
                    // await testEditor(BasicEditor, {
                    //     contentBefore: '<p>[]</p>',
                    //     stepFunction: deleteForward,
                    //     contentAfter: '<p>[]</p>',
                    // });
                    // TODO this cannot actually be tested currently as a
                    // backspace/delete in that case is not even detected
                    // (no input event to rollback)
                    // await testEditor(BasicEditor, {
                    //     contentBefore: '<p>[<br>]</p>',
                    //     stepFunction: deleteForward,
                    //     // The <br> is there only to make the <p> visible.
                    //     // It does not exist in VDocument and selecting it
                    //     // has no meaning in the DOM.
                    //     contentAfter: '<p>[]<br></p>',
                    // });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>abc[]</p>',
                    });
                });
                it('should delete the first character in a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]abc</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>[]bc</p>',
                    });
                });
                it('should delete a character within a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[]bc</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>a[]c</p>',
                    });
                });
                it('should delete the last character in a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]c</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab []c</p>',
                        stepFunction: deleteForward,
                        // The space should be converted to an unbreakable space
                        // so it is visible.
                        contentAfter: '<p>ab&nbsp;[]</p>',
                    });
                });
                it('should merge a paragraph into an empty paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]<br></p><p>abc</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>[]abc</p>',
                    });
                });
                it('should not break unbreakables', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<table><tbody><tr><td>[]<br></td><td>abc</td></tr></tbody></table>',
                        stepFunction: deleteForward,
                        contentAfter:
                            '<table><tbody><tr><td>[]<br></td><td>abc</td></tr></tbody></table>',
                    });
                });
                it('should merge the following inline text node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc</p>[]def',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>abc[]def</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc</p>[]def<p>ghi</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>abc[]def</p><p>ghi</p>',
                    });
                });
            });
            describe('Line breaks', () => {
                describe('Single', () => {
                    it('should delete a leading line break', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br>abc</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>[]abc</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br> abc</p>',
                            stepFunction: deleteForward,
                            // The space after the <br> is expected to be parsed
                            // away, like it is in the DOM.
                            contentAfter: '<p>[]abc</p>',
                        });
                    });
                    it('should delete a line break within a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]<br>cd</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>ab[]cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab []<br>cd</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>ab []cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]<br> cd</p>',
                            stepFunction: deleteForward,
                            // The space after the <br> is expected to be parsed
                            // away, like it is in the DOM.
                            contentAfter: '<p>ab[]cd</p>',
                        });
                    });
                    it('should delete a trailing line break', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]<br><br></p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>abc[]</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc []<br><br></p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>abc&nbsp;[]</p>',
                        });
                    });
                    it('should delete a character and a line break, emptying a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]a<br><br></p><p>bcd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>[]<br></p><p>bcd</p>',
                        });
                    });
                    it('should delete a character before a trailing line break', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]c<br><br></p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>ab[]<br><br></p>',
                        });
                    });
                });
                describe('Consecutive', () => {
                    it('should merge a paragraph into a paragraph with 4 <br>', async () => {
                        // 1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>ab</p><p><br><br><br>[]cd</p>',
                        });
                        // 2-1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                            stepFunction: deleteForward,
                            // This should be identical to 1
                            contentAfter: '<p>ab</p><p><br><br><br>[]cd</p>',
                        });
                    });
                    it('should delete a trailing line break', async () => {
                        // 3-1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>ab</p><p><br><br>[]<br></p><p>cd</p>',
                        });
                    });
                    it('should delete a trailing line break, then merge a paragraph into a paragraph with 3 <br>', async () => {
                        // 3-2
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab</p><p><br><br>[]cd</p>',
                        });
                    });
                    it('should delete a line break', async () => {
                        // 4-1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>ab</p><p><br>[]<br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete two line breaks', async () => {
                        // 4-2
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab</p><p><br>[]<br></p><p>cd</p>',
                        });
                    });
                    it('should delete two line breaks, then merge a paragraph into a paragraph with 2 <br>', async () => {
                        // 4-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab</p><p><br>[]cd</p>',
                        });
                    });
                    it('should delete a line break', async () => {
                        // 5-1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>ab</p><p>[]<br><br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete two line breaks', async () => {
                        // 5-2
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]<br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete three line breaks (emptying a paragraph)', async () => {
                        // 5-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]<br></p><p>cd</p>',
                        });
                    });
                    it('should delete three line breaks, then merge a paragraph into an empty parargaph', async () => {
                        // 5-4
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]cd</p>',
                        });
                    });
                    it('should merge a paragraph with 4 <br> into a paragraph with text', async () => {
                        // 6-1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>ab[]<br><br><br><br></p><p>cd</p>',
                        });
                    });
                    it('should merge a paragraph with 4 <br> into a paragraph with text, then delete a line break', async () => {
                        // 6-2
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab[]<br><br><br></p><p>cd</p>',
                        });
                    });
                    it('should merge a paragraph with 4 <br> into a paragraph with text, then delete two line breaks', async () => {
                        // 6-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab[]<br><br></p><p>cd</p>',
                        });
                    });
                    it('should merge a paragraph with 4 <br> into a paragraph with text, then delete three line breaks', async () => {
                        // 6-4
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab[]</p><p>cd</p>',
                        });
                    });
                    it('should merge a paragraph with 4 <br> into a paragraph with text, then delete three line breaks, then merge two paragraphs with text', async () => {
                        // 6-5
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab[]cd</p>',
                        });
                    });
                });
            });
            describe('Pre', () => {
                it('should delete a character in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd</pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>ab[]d</pre>',
                    });
                });
                it('should delete a character in a pre (space before)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     ab[]cd</pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>     ab[]d</pre>',
                    });
                });
                it('should delete a character in a pre (space after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd     </pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>ab[]d     </pre>',
                    });
                });
                it('should delete a character in a pre (space before and after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     ab[]cd     </pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>     ab[]d     </pre>',
                    });
                });
                it('should delete a space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>  []   ab</pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>  []  ab</pre>',
                    });
                });
                it('should delete a newline in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]\ncd</pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>ab[]cd</pre>',
                    });
                });
                it('should delete all leading space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>[]     ab</pre>',
                        stepFunction: async BasicEditor => {
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                        },
                        contentAfter: '<pre>[]ab</pre>',
                    });
                });
                it('should delete all trailing space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]     </pre>',
                        stepFunction: async BasicEditor => {
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                        },
                        contentAfter: '<pre>ab[]</pre>',
                    });
                });
            });
            describe('Formats', () => {
                it('should delete a character after a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc[]</b>def</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><b>abc[]</b>ef</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc</b>[]def</p>',
                        stepFunction: deleteForward,
                        // The selection is normalized so we only have one way
                        // to represent a position.
                        contentAfter: '<p><b>abc[]</b>ef</p>',
                    });
                });
            });
            describe('Merging different types of elements', () => {
                it('should merge a paragraph with text into a heading1 with text', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>ab[]</h1><p>cd</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>ab[]cd</h1>',
                    });
                });
                it('should merge an empty paragraph into a heading1 with text', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>ab[]</h1><p><br></p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>ab[]</h1>',
                    });
                });
                it('should merge a heading1 with text into an empty paragraph (keeping the heading)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><br>[]</p><h1>ab</h1>',
                        stepFunction: deleteForward,
                        // JW cAfter: '<h1>[]ab</h1>',
                        contentAfter: '<p>[]ab</p>',
                    });
                });
                it('should merge a text following a paragraph (keeping the text)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]</p>cd',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]</p>cd<p>ef</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]cd</p><p>ef</p>',
                    });
                });
            });
            describe('With attributes', () => {
                it('should merge a paragraph without class into an empty paragraph with a class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p class="a"><br>[]</p><p>abc</p>',
                        stepFunction: deleteForward,
                        // JW cAfter: '<p>[]abc</p>',
                        contentAfter: '<p class="a">[]abc</p>',
                    });
                });
                it('should merge two paragraphs with spans of same classes', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">dom to[]</span></p><p><span class="a">edit</span></p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><span class="a">dom to[]edit</span></p>',
                    });
                });
                it('should merge two paragraphs with spans of different classes without merging the spans', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">dom to[]</span></p><p><span class="b">edit</span></p>',
                        stepFunction: deleteForward,
                        contentAfter:
                            '<p><span class="a">dom to[]</span><span class="b">edit</span></p>',
                    });
                });
                it('should merge two paragraphs of different classes, each containing spans of the same class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p class="a"><span class="b">ab[]</span></p><p class="c"><span class="b">cd</span></p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p class="a"><span class="b">ab[]cd</span></p>',
                    });
                });
                it('should merge two paragraphs of different classes, each containing spans of different classes without merging the spans', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p class="a"><span class="b">ab[]</span></p><p class="c"><span class="d">cd</span></p>',
                        stepFunction: deleteForward,
                        contentAfter:
                            '<p class="a"><span class="b">ab[]</span><span class="d">cd</span></p>',
                    });
                });
                it('should delete a line break between two spans with bold and merge these formats', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><span><b>ab[]</b></span><br/><span><b>cd</b></span></p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><span><b>ab[]cd</b></span></p>',
                    });
                });
                it('should delete a character in a span with bold, then a line break between two spans with bold and merge these formats', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span><b>a[]b</b></span><br><span><b><br>cde</b></span></p>',
                        stepFunction: async (editor) => {
                            await deleteForward(editor);
                            await deleteForward(editor);
                        },
                        contentAfter: '<p><span><b>a[]<br>cde</b></span></p>',
                    });
                });
            });
        });
        describe('Selection not collapsed', () => {
            it('should delete part of the text within a paragraph', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[cd]ef</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p>ab[]ef</p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab]cd[ef</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p>ab[]ef</p>',
                });
            });
            it('should delete across two paragraphs', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[cd</p><p>ef]gh</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p>ab[]gh</p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab]cd</p><p>ef[gh</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p>ab[]gh</p>',
                });
            });
            it('should delete all the text in a paragraph', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p>[]<br></p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc[</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p>[]<br></p>',
                });
            });
            it('should delete a complex selection accross format nodes and multiple paragraphs', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>ab[cd</b></p><p><b>ef<br/>gh</b>ij<i>kl]</i>mn</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p><b>ab[]</b>mn</p>',
                });
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>ab[cd</b></p><p><b>ef<br/>gh</b>ij<i>k]l</i>mn</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p><b>ab[]</b><i>l</i>mn</p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>ab]cd</b></p><p><b>ef<br/>gh</b>ij<i>kl[</i>mn</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p><b>ab[]</b>mn</p>',
                });
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>ab]cd</b></p><p><b>ef<br/>gh</b>ij<i>k[l</i>mn</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p><b>ab[]</b><i>l</i>mn</p>',
                });
            });
            it('should delete all contents of a complex DOM with format nodes and multiple paragraphs', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>[abcd</b></p><p><b>ef<br/>gh</b>ij<i>kl</i>mn]</p>',
                    stepFunction: deleteForward,
                    // JW cAfter: '<p>[]<br></p>',
                    contentAfter: '<p><b>[]</b><br></p>', // Note: this is actually like that on google doc
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>]abcd</b></p><p><b>ef<br/>gh</b>ij<i>kl</i>mn[</p>',
                    stepFunction: deleteForward,
                    // JW cAfter: '<p>[]<br></p>',
                    contentAfter: '<p><b>[]</b><br></p>', // Note: this is actually like that on google doc
                });
            });
            it('should delete a selection accross a heading1 and a paragraph', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>ab [cd</h1><p>ef]gh</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<h1>ab []gh</h1>',
                });
                // // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>ab ]cd</h1><p>ef[gh</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<h1>ab []gh</h1>',
                });
            });
            it('should delete a selection from the beginning of a heading1 with a format to the middle of a paragraph', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<h1><b>[abcd</b></h1><p>ef]gh</p>',
                    stepFunction: deleteForward,
                    // JW cAfter: '<h1>[]gh</h1>',
                    contentAfter: '<h1><b>[]</b>gh</h1>',
                });
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>[<b>abcd</b></h1><p>ef]gh</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<h1>[]gh</h1>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<h1><b>]abcd</b></h1><p>ef[gh</p>',
                    stepFunction: deleteForward,
                    // JW cAfter: '<h1>[]gh</h1>',
                    contentAfter: '<h1><b>[]</b>gh</h1>',
                });
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>]<b>abcd</b></h1><p>ef[gh</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<h1>[]gh</h1>',
                });
            });
            it('should not break unbreakables', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<table><tbody><tr><td>a[bc</td><td>de]f</td></tr></tbody></table>',
                    stepFunction: deleteForward,
                    contentAfter: '<table><tbody><tr><td>a[]</td><td>f</td></tr></tbody></table>',
                });
                await testEditor(BasicEditor, {
                    contentBefore: '<p class="oe_unbreakable">a[bc</p><p class="oe_unbreakable">de]f</p>',
                    stepFunction: deleteForward,
                    contentAfter: '<p class="oe_unbreakable">a[]</p><p class="oe_unbreakable">f</p>', // JW without oe_breakable classes of course
                });
            });
            it('should delete a heading (triple click delete)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>[abc</h1><p>]def</p>',
                    stepFunction: deleteForward,
                    // JW cAfter: '<p>[]def</p>',
                    contentAfter: '<h1>[]<br></h1><p>def</p>',
                });
            });
        });
    });

    describe('deleteBackward', () => {
        describe('Selection collapsed', () => {
            describe('Basic', () => {
                it('should do nothing', async () => {
                    // TODO the addition of <br/> "correction" part was judged
                    // unnecessary to enforce, the rest of the test still makes
                    // sense: not removing the unique <p/> and keeping the
                    // cursor at the right place.
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]</p>',
                    });
                    // TODO this cannot actually be tested currently as a
                    // backspace/delete in that case is not even detected
                    // (no input event to rollback)
                    // await testEditor(BasicEditor, {
                    //     contentBefore: '<p>[<br>]</p>',
                    //     stepFunction: deleteBackward,
                    //     // The <br> is there only to make the <p> visible.
                    //     // It does not exist in VDocument and selecting it
                    //     // has no meaning in the DOM.
                    //     contentAfter: '<p>[]<br></p>',
                    // });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]abc</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]abc</p>',
                    });
                });
                it('should delete the first character in a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[]bc</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]bc</p>',
                    });
                });
                it('should delete a character within a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]c</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>a[]c</p>',
                    });
                });
                it('should delete the last character in a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab c[]</p>',
                        stepFunction: deleteBackward,
                        // The space should be converted to an unbreakable space
                        // so it is visible.
                        contentAfter: '<p>ab&nbsp;[]</p>',
                    });
                });
                it('should merge a paragraph into an empty paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><br></p><p>[]abc</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]abc</p>',
                    });
                });
                it('should not break unbreakables', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<table><tbody><tr><td>[]<br></td><td>abc</td></tr></tbody></table>',
                        stepFunction: deleteBackward,
                        contentAfter:
                            '<table><tbody><tr><td>[]<br></td><td>abc</td></tr></tbody></table>',
                    });
                });
            });
            describe('Line breaks', () => {
                describe('Single', () => {
                    it('should delete a leading line break', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br>[]abc</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>[]abc</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br>[] abc</p>',
                            stepFunction: deleteBackward,
                            // The space after the <br> is expected to be parsed
                            // away, like it is in the DOM.
                            contentAfter: '<p>[]abc</p>',
                        });
                    });
                    it('should delete a line break within a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab<br>[]cd</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>ab[]cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab <br>[]cd</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>ab []cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab<br>[] cd</p>',
                            stepFunction: deleteBackward,
                            // The space after the <br> is expected to be parsed
                            // away, like it is in the DOM.
                            contentAfter: '<p>ab[]cd</p>',
                        });
                    });
                    it('should delete a trailing line break', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc<br><br>[]</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>abc[]</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc<br>[]<br></p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>abc[]</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc <br><br>[]</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>abc&nbsp;[]</p>',
                        });
                    });
                    it('should delete a character and a line break, emptying a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>aaa</p><p><br>a[]</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>aaa</p><p>[]<br></p>',
                        });
                    });
                    it('should delete a character after a trailing line break', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab<br>c[]</p>',
                            stepFunction: deleteBackward,
                            // A new <br> should be insterted, to make the first one
                            // visible.
                            contentAfter: '<p>ab<br>[]<br></p>',
                        });
                    });
                });
                describe('Consecutive', () => {
                    it('should merge a paragraph with 4 <br> into a paragraph with text', async () => {
                        // 1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>ab[]<br><br><br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete a line break', async () => {
                        // 2-1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>ab</p><p>[]<br><br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete a line break, then merge a paragraph with 3 <br> into a paragraph with text', async () => {
                        // 2-2
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab[]<br><br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete a line break', async () => {
                        // 3-1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>ab</p><p><br>[]<br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete two line breaks', async () => {
                        // 3-2
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]<br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete two line breaks, then merge a paragraph with 3 <br> into a paragraph with text', async () => {
                        // 3-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab[]<br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete a line break when several', async () => {
                        // 4-1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                            stepFunction: deleteBackward,
                            // A trailing line break is rendered as two <br>.
                            contentAfter: '<p>ab</p><p><br><br>[]<br></p><p>cd</p>',
                        });
                        // 5-1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                            stepFunction: deleteBackward,
                            // This should be identical to 4-1
                            contentAfter: '<p>ab</p><p><br><br>[]<br></p><p>cd</p>',
                        });
                    });
                    it('should delete two line breaks', async () => {
                        // 4-2
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            // A trailing line break is rendered as two <br>.
                            contentAfter: '<p>ab</p><p><br>[]<br></p><p>cd</p>',
                        });
                        // 5-2
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            // This should be identical to 4-2
                            contentAfter: '<p>ab</p><p><br>[]<br></p><p>cd</p>',
                        });
                    });
                    it('should delete three line breaks (emptying a paragraph)', async () => {
                        // 4-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]<br></p><p>cd</p>',
                        });
                        // 5-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            // This should be identical to 4-3
                            contentAfter: '<p>ab</p><p>[]<br></p><p>cd</p>',
                        });
                    });
                    it('should delete three line breaks, then merge an empty parargaph into a paragraph with text', async () => {
                        // 4-4
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            // This should be identical to 4-4
                            contentAfter: '<p>ab[]</p><p>cd</p>',
                        });
                        // 5-4
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab[]</p><p>cd</p>',
                        });
                    });
                    it('should merge a paragraph into a paragraph with 4 <br>', async () => {
                        // 6-1
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>ab</p><p><br><br><br>[]cd</p>',
                        });
                    });
                    it('should merge a paragraph into a paragraph with 4 <br>, then delete a trailing line break', async () => {
                        // 6-2
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab</p><p><br><br>[]cd</p>',
                        });
                    });
                    it('should merge a paragraph into a paragraph with 4 <br>, then delete two line breaks', async () => {
                        // 6-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab</p><p><br>[]cd</p>',
                        });
                    });
                    it('should merge a paragraph into a paragraph with 4 <br>, then delete three line breaks', async () => {
                        // 6-4
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]cd</p>',
                        });
                    });
                    it('should merge a paragraph into a paragraph with 4 <br>, then delete three line breaks, then merge two paragraphs with text', async () => {
                        // 6-5
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                            stepFunction: async (editor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab[]cd</p>',
                        });
                    });
                });
            });
            describe('Pre', () => {
                it('should delete a character in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd</pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>a[]cd</pre>',
                    });
                });
                it('should delete a character in a pre (space before)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     ab[]cd</pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>     a[]cd</pre>',
                    });
                });
                it('should delete a character in a pre (space after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd     </pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>a[]cd     </pre>',
                    });
                });
                it('should delete a character in a pre (space before and after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     ab[]cd     </pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>     a[]cd     </pre>',
                    });
                });
                it('should delete a space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>   []  ab</pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>  []  ab</pre>',
                    });
                });
                it('should delete a newline in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab\n[]cd</pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>ab[]cd</pre>',
                    });
                });
                it('should delete all leading space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     []ab</pre>',
                        stepFunction: async BasicEditor => {
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                        },
                        contentAfter: '<pre>[]ab</pre>',
                    });
                });
                it('should delete all trailing space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab     []</pre>',
                        stepFunction: async BasicEditor => {
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                        },
                        contentAfter: '<pre>ab[]</pre>',
                    });
                });
            });
            describe('Formats', () => {
                it('should delete a character before a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc<b>[]def</b></p>',
                        stepFunction: deleteBackward,
                        // The selection is normalized so we only have one way
                        // to represent a position.
                        contentAfter: '<p>ab[]<b>def</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]<b>def</b></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]<b>def</b></p>',
                    });
                });
            });
            describe('Merging different types of elements', () => {
                it('should merge a paragraph with text into a paragraph with text', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab</p><p>[]cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                });
                it('should merge a paragraph with formated text into a paragraph with text', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>aa</p><p>[]a<i>bbb</i></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>aa[]a<i>bbb</i></p>',
                    });
                });
                it('should merge a paragraph with text into a heading1 with text', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>ab</h1><p>[]cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<h1>ab[]cd</h1>',
                    });
                });
                it('should merge an empty paragraph into a heading1 with text', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>ab</h1><p>[]<br></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<h1>ab[]</h1>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>ab</h1><p><br>[]</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<h1>ab[]</h1>',
                    });
                });
                it('should merge a heading1 with text into an empty paragraph (keeping the heading)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><br></p><h1>[]ab</h1>',
                        stepFunction: deleteBackward,
                        // JW cAfter: '<h1>[]ab</h1>',
                        contentAfter: '<p>[]ab</p>',
                    });
                });
                it('should merge with previous node (default behaviour)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<jw-block-a>a</jw-block-a><jw-block-b>[]b</jw-block-b>',
                        stepFunction: deleteBackward,
                        contentAfter: '<jw-block-a>a[]b</jw-block-a>',
                    });
                    // await testEditor(BasicEditor, {
                    //     contentBefore: '<jw-block-a>a</jw-block-a><jw-block-b>[<br>]</jw-block-b>',
                    //     stepFunction: deleteBackward,
                    //     contentAfter: '<jw-block-a>a[]</jw-block-a>',
                    // });
                });
                it('should merge nested elements (default behaviour)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<jw-block-a><jw-block-b>ab</jw-block-b></jw-block-a><jw-block-c><jw-block-d>[]cd</jw-block-d></jw-block-c>',
                        stepFunction: deleteBackward,
                        contentAfter: '<jw-block-a><jw-block-b>ab[]cd</jw-block-b></jw-block-a>',
                    });
                    // await testEditor(BasicEditor, {
                    //     contentBefore:
                    //         '<jw-block-a><jw-block-b>ab</jw-block-b></jw-block-a><jw-block-c><jw-block-d>[<br>]</jw-block-d></jw-block-c>',
                    //     stepFunction: deleteBackward,
                    //     contentAfter: '<jw-block-a><jw-block-b>ab[]</jw-block-b></jw-block-a>',
                    // });
                });
                it('should not break unbreakables', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<table><tbody><tr><td><br></td><td>[]abc</td></tr></tbody></table>',
                        stepFunction: deleteBackward,
                        contentAfter:
                            '<table><tbody><tr><td><br></td><td>[]abc</td></tr></tbody></table>',
                    });
                });
                it('should merge a text preceding a paragraph (removing the paragraph)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'ab<p>[]cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: 'ab[]cd',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: 'ab<p>[]cd</p>ef',
                        stepFunction: deleteBackward,
                        contentAfter: 'ab[]cdef', // FIXME for me this is wrong, I would expect ab[]cd<p>ef</p> or something like that ?
                    });
                });
            });
            describe('With attributes', () => {
                it('should merge a paragraph without class into an empty paragraph with a class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p class="a"><br></p><p>[]abc</p>',
                        stepFunction: deleteBackward,
                        // JW cAfter: '<p>[]abc</p>',
                        contentAfter: '<p class="a">[]abc</p>',
                    });
                });
                it('should merge two paragraphs with spans of same classes', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">ab</span></p><p><span class="a">[]cd</span></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p><span class="a">ab[]cd</span></p>',
                    });
                });
                it('should merge two paragraphs with spans of different classes without merging the spans', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">ab</span></p><p><span class="b">[]cd</span></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p><span class="a">ab[]</span><span class="b">cd</span></p>',
                    });
                });
                it('should merge two paragraphs of different classes, each containing spans of the same class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p class="a"><span class="b">ab</span></p><p class="c"><span class="b">[]cd</span></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p class="a"><span class="b">ab[]cd</span></p>',
                    });
                });
                it('should merge two paragraphs of different classes, each containing spans of different classes without merging the spans', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p class="a"><span class="b">ab</span></p><p class="c"><span class="d">[]cd</span></p>',
                        stepFunction: deleteBackward,
                        contentAfter:
                            '<p class="a"><span class="b">ab[]</span><span class="d">cd</span></p>',
                    });
                });
                it('should delete a line break between two spans with bold and merge these formats', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><span><b>ab</b></span><br/><span><b>[]cd</b></span></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p><span><b>ab[]cd</b></span></p>',
                    });
                });
                it('should delete a character in a span with bold, then a line break between two spans with bold and merge these formats', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span><b>ab<br></b></span><br><span><b>c[]de</b></span></p>',
                        stepFunction: async (editor) => {
                            await deleteBackward(editor);
                            await deleteBackward(editor);
                        },
                        contentAfter: '<p><span><b>ab<br>[]de</b></span></p>',
                    });
                });
            });
            describe('POC extra tests', () => {
                it('should delete an unique space between letters', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab []cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                });
                it('should delete the first character in a paragraph (2)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[] bc</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]&nbsp;bc</p>',
                    });
                });
                it('should delete a space', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab [] de</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]de</p>',
                    });
                });
                it('should delete a one letter word', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab c[] de</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab []&nbsp;de</p>',
                    });
                });
                it('should fill empty block with a <br>', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[]</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]<br></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><img>[]</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]<br></p>',
                    });
                });
                it('should merge a paragraph with text into a paragraph with text removing spaces', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab   </p>    <p>   []cd</p>',
                        stepFunction: deleteBackward,
                        // This is a tricky case: the spaces after ab are
                        // visible on Firefox but not on Chrome... to be
                        // consistent we enforce the space removal here but
                        // maybe not a good idea... see next case ->
                        contentAfter: '<p>ab[]cd</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab   <br></p>    <p>   []cd</p>',
                        stepFunction: deleteBackward,
                        // This is the same visible case as the one above. The
                        // difference is that here the space after ab is visible
                        // on both Firefox and Chrome, so it should stay
                        // visible.
                        contentAfter: '<p>ab   []cd</p>',
                    });
                });
                it('should remove a br and remove following spaces', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab<br><b>[]   </b>cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab<br><b>[]   x</b>cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]<b>x</b>cd</p>',
                    });
                });
                it('should ignore empty inline node between blocks being merged', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc</p><i> </i><p>[]def</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>abc[]def</p>',
                    });
                });
                it('should merge in nested paragraphs and remove invisible inline content', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<div><p>ab</p>    </div><p>[]c</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<div><p>ab[]c</p></div>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<div><p>ab</p> <i> </i> </div><p>[]c</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<div><p>ab[]c</p></div>',
                    });
                });
                it('should not merge in nested blocks if inline content afterwards', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<div><p>ab</p>de</div><p>[]fg</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<div><p>ab</p>de[]fg</div>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<div><p>ab</p><img></div><p>[]fg</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<div><p>ab</p><img>[]fg</div>',
                    });
                });
                it('should move paragraph content to empty block', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc</p><h1><br></h1><p>[]def</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>abc</p><h1>[]def</h1>',
                    });
                });
                it('should remove only one br between contents', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc<br>[]<br>def</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>abc[]<br>def</p>',
                    });
                });
                it('should remove an empty block instead of merging it', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><br></p><p>[]<br></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]<br></p>',
                    });
                });
            });
        });
        describe('Selection not collapsed', () => {
            it('should delete part of the text within a paragraph', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[cd]ef</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<p>ab[]ef</p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab]cd[ef</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<p>ab[]ef</p>',
                });
            });
            it('should delete across two paragraphs', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[cd</p><p>ef]gh</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<p>ab[]gh</p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab]cd</p><p>ef[gh</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<p>ab[]gh</p>',
                });
            });
            it('should delete all the text in a paragraph', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<p>[]<br></p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc[</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<p>[]<br></p>',
                });
            });
            it('should delete a complex selection accross format nodes and multiple paragraphs', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>ab[cd</b></p><p><b>ef<br/>gh</b>ij<i>kl]</i>mn</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<p><b>ab[]</b>mn</p>',
                });
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>ab[cd</b></p><p><b>ef<br/>gh</b>ij<i>k]l</i>mn</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<p><b>ab[]</b><i>l</i>mn</p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>ab]cd</b></p><p><b>ef<br/>gh</b>ij<i>kl[</i>mn</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<p><b>ab[]</b>mn</p>',
                });
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>ab]cd</b></p><p><b>ef<br/>gh</b>ij<i>k[l</i>mn</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<p><b>ab[]</b><i>l</i>mn</p>',
                });
            });
            it('should delete all contents of a complex DOM with format nodes and multiple paragraphs', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>[abcd</b></p><p><b>ef<br/>gh</b>ij<i>kl</i>mn]</p>',
                    stepFunction: deleteBackward,
                    // JW cAfter: '<p>[]<br></p>',
                    contentAfter: '<p><b>[]</b><br></p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>]abcd</b></p><p><b>ef<br/>gh</b>ij<i>kl</i>mn[</p>',
                    stepFunction: deleteBackward,
                    // JW cAfter: '<p>[]<br></p>',
                    contentAfter: '<p><b>[]</b><br></p>',
                });
            });
            it('should delete a selection accross a heading1 and a paragraph', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>ab [cd</h1><p>ef]gh</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<h1>ab []gh</h1>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>ab ]cd</h1><p>ef[gh</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<h1>ab []gh</h1>',
                });
            });
            it('should delete a selection from the beginning of a heading1 with a format to the middle fo a paragraph', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<h1><b>[abcd</b></h1><p>ef]gh</p>',
                    stepFunction: deleteBackward,
                    // JW cAfter: '<h1>[]gh</h1>',
                    contentAfter: '<h1><b>[]</b>gh</h1>',
                });
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>[<b>abcd</b></h1><p>ef]gh</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<h1>[]gh</h1>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<h1><b>]abcd</b></h1><p>ef[gh</p>',
                    stepFunction: deleteBackward,
                    // JW cAfter: '<h1>[]gh</h1>',
                    contentAfter: '<h1><b>[]</b>gh</h1>',
                });
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>]<b>abcd</b></h1><p>ef[gh</p>',
                    stepFunction: deleteBackward,
                    contentAfter: '<h1>[]gh</h1>',
                });
            });
            it('should delete a heading (triple click backspace)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>[abc</h1><p>]def</p>',
                    stepFunction: deleteBackward,
                    // JW cAfter: '<p>[]def</p>',
                    contentAfter: '<h1>[]<br></h1><p>def</p>',
                });
            });
        });
    });

    describe('insertParagraphBreak', () => {
        describe('Selection collapsed', () => {
            describe('Basic', () => {
                it('should duplicate an empty paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]<br></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><br></p><p>[]<br></p>',
                    });
                    // TODO this cannot actually be tested currently as a
                    // backspace/delete in that case is not even detected
                    // (no input event to rollback)
                    // await testEditor(BasicEditor, {
                    //     contentBefore: '<p>[<br>]</p>',
                    //     stepFunction: insertParagraphBreak,
                    //     contentAfter: '<p><br></p><p>[]<br></p>',
                    // });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><br>[]</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><br></p><p>[]<br></p>',
                    });
                });
                it('should insert an empty paragraph before a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]abc</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><br></p><p>[]abc</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[] abc</p>',
                        stepFunction: insertParagraphBreak,
                        // JW cAfter: '<p><br></p><p>[]abc</p>',
                        contentAfter: '<p><br></p><p>[] abc</p>',
                    });
                });
                it('should split a paragraph in two', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]cd</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p>ab</p><p>[]cd</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab []cd</p>',
                        stepFunction: insertParagraphBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible.
                        contentAfter: '<p>ab&nbsp;</p><p>[]cd</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[] cd</p>',
                        stepFunction: insertParagraphBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible.
                        contentAfter: '<p>ab</p><p>[]&nbsp;cd</p>',
                    });
                });
                it('should insert an empty paragraph after a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p>abc</p><p>[]<br></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[] </p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p>abc</p><p>[]<br></p>',
                    });
                });
            });
            describe('Pre', () => {
                it('should insert a line break within the pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd</pre>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<pre>ab<br>[]cd</pre>',
                    });
                });
                it('should insert a new paragraph after the pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>abc[]</pre>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<pre>abc</pre><p>[]<br></p>',
                    });
                });
            });
            describe('Consecutive', () => {
                it('should duplicate an empty paragraph twice', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]<br></p>',
                        stepFunction: async (editor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p><br></p><p><br></p><p>[]<br></p>',
                    });
                    // TODO this cannot actually be tested currently as a
                    // backspace/delete in that case is not even detected
                    // (no input event to rollback)
                    // await testEditor(BasicEditor, {
                    //     contentBefore: '<p>[<br>]</p>',
                    //     stepFunction: async (editor) => {
                    //         await insertParagraphBreak(editor);
                    //         await insertParagraphBreak(editor);
                    //     },
                    //     contentAfter: '<p><br></p><p><br></p><p>[]<br></p>',
                    // });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><br>[]</p>',
                        stepFunction: async (editor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p><br></p><p><br></p><p>[]<br></p>',
                    });
                });
                it('should insert two empty paragraphs before a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]abc</p>',
                        stepFunction: async (editor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p><br></p><p><br></p><p>[]abc</p>',
                    });
                });
                it('should split a paragraph in three', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]cd</p>',
                        stepFunction: async (editor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p>ab</p><p><br></p><p>[]cd</p>',
                    });
                });
                it('should split a paragraph in four', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]cd</p>',
                        stepFunction: async (editor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p>ab</p><p><br></p><p><br></p><p>[]cd</p>',
                    });
                });
                it('should insert two empty paragraphs after a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]</p>',
                        stepFunction: async (editor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p>abc</p><p><br></p><p>[]<br></p>',
                    });
                });
            });
            describe('Format', () => {
                it('should split a paragraph before a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]<b>def</b></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p>abc</p><p><b>[]def</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        // That selection is equivalent to []<b>
                        contentBefore: '<p>abc<b>[]def</b></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p>abc</p><p><b>[]def</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc <b>[]def</b></p>',
                        stepFunction: insertParagraphBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible (because it's after a
                        // <br>).
                        contentAfter: '<p>abc&nbsp;</p><p><b>[]def</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc<b>[] def </b></p>',
                        stepFunction: insertParagraphBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible (because it's before a
                        // <br>).
                        // JW cAfter: '<p>abc</p><p><b>[]&nbsp;def</b></p>',
                        contentAfter: '<p>abc</p><p><b>[]&nbsp;def </b></p>',
                    });
                });
                it('should split a paragraph after a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc</b>[]def</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><b>abc</b></p><p>[]def</p>',
                    });
                    await testEditor(BasicEditor, {
                        // That selection is equivalent to </b>[]
                        contentBefore: '<p><b>abc[]</b>def</p>',
                        stepFunction: insertParagraphBreak,
                        // JW cAfter: '<p><b>abc</b></p><p>[]def</p>',
                        contentAfter: '<p><b>abc</b></p><p><b>[]</b>def</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc[]</b> def</p>',
                        stepFunction: insertParagraphBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible.
                        // JW cAfter: '<p><b>abc</b></p><p>[]&nbsp;def</p>',
                        contentAfter: '<p><b>abc</b></p><p><b>[]</b>&nbsp;def</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc []</b>def</p>',
                        stepFunction: insertParagraphBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible (because it's before a
                        // <br>).
                        // JW cAfter: '<p><b>abc&nbsp;</b></p><p>[]def</p>',
                        contentAfter: '<p><b>abc&nbsp;</b></p><p><b>[]</b>def</p>',
                    });
                });
                it('should split a paragraph at the beginning of a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]<b>abc</b></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><br></p><p><b>[]abc</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        // That selection is equivalent to []<b>
                        contentBefore: '<p><b>[]abc</b></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><br></p><p><b>[]abc</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>[] abc</b></p>',
                        stepFunction: insertParagraphBreak,
                        // The space should have been parsed away.
                        // JW cAfter: '<p><br></p><p><b>[]abc</b></p>',
                        contentAfter: '<p><br></p><p><b>[] abc</b></p>',
                    });
                });
                it('should split a paragraph within a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab[]cd</b></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><b>ab</b></p><p><b>[]cd</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab []cd</b></p>',
                        stepFunction: insertParagraphBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible.
                        contentAfter: '<p><b>ab&nbsp;</b></p><p><b>[]cd</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab[] cd</b></p>',
                        stepFunction: insertParagraphBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible.
                        contentAfter: '<p><b>ab</b></p><p><b>[]&nbsp;cd</b></p>',
                    });
                });
                it('should split a paragraph at the end of a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc</b>[]</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><b>abc</b></p><p>[]<br></p>',
                    });
                    await testEditor(BasicEditor, {
                        // That selection is equivalent to </b>[]
                        contentBefore: '<p><b>abc[]</b></p>',
                        stepFunction: insertParagraphBreak,
                        // JW cAfter: '<p><b>abc</b></p><p>[]<br></p>',
                        contentAfter: '<p><b>abc</b></p><p><b>[]</b><br></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc[] </b></p>',
                        stepFunction: insertParagraphBreak,
                        // The space should have been parsed away.
                        // JW cAfter: '<p><b>abc</b></p><p>[]<br></p>',
                        contentAfter: '<p><b>abc</b></p><p><b>[]</b><br></p>',
                    });
                });
            });
            describe('With attributes', () => {
                it('should insert an empty paragraph before a paragraph with a span with a class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">ab</span></p><p><span class="b">[]cd</span></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter:
                            '<p><span class="a">ab</span></p><p><br></p><p><span class="b">[]cd</span></p>',
                    });
                });
                it('should split a paragraph with a span with a bold in two', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><span><b>ab[]cd</b></span></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter:
                            '<p><span><b>ab</b></span></p><p><span><b>[]cd</b></span></p>',
                    });
                });
                it('should split a paragraph at its end, with a paragraph after it, and both have the same class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p class="a">a[]</p><p class="a"><br></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter:
                            '<p class="a">a</p><p class="a">[]<br></p><p class="a"><br></p>',
                    });
                });
            });
            describe('POC extra tests', () => {
                it('should duplicate an empty h1', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>[]<br></h1>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<h1><br></h1><p>[]<br></p>',
                    });
                });
            });
        });
        describe('Selection not collapsed', () => {
            it('should delete the first half of a paragraph, then split it', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[ab]cd</p>',
                    stepFunction: insertParagraphBreak,
                    contentAfter: '<p><br></p><p>[]cd</p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]ab[cd</p>',
                    stepFunction: insertParagraphBreak,
                    contentAfter: '<p><br></p><p>[]cd</p>',
                });
            });
            it('should delete part of a paragraph, then split it', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[bc]d</p>',
                    stepFunction: insertParagraphBreak,
                    contentAfter: '<p>a</p><p>[]d</p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a]bc[d</p>',
                    stepFunction: insertParagraphBreak,
                    contentAfter: '<p>a</p><p>[]d</p>',
                });
            });
            it('should delete the last half of a paragraph, then split it', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[cd]</p>',
                    stepFunction: insertParagraphBreak,
                    contentAfter: '<p>ab</p><p>[]<br></p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab]cd[</p>',
                    stepFunction: insertParagraphBreak,
                    contentAfter: '<p>ab</p><p>[]<br></p>',
                });
            });
            it('should delete all contents of a paragraph, then split it', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abcd]</p>',
                    stepFunction: insertParagraphBreak,
                    contentAfter: '<p><br></p><p>[]<br></p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abcd[</p>',
                    stepFunction: insertParagraphBreak,
                    contentAfter: '<p><br></p><p>[]<br></p>',
                });
            });
        });
    });

    describe('insertLineBreak', () => {
        describe('Selection collapsed', () => {
            describe('Basic', () => {
                it('should insert a <br> into an empty paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]<br></p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]<br></p>',
                    });
                    // TODO this cannot actually be tested currently as a
                    // backspace/delete in that case is not even detected
                    // (no input event to rollback)
                    // await testEditor(BasicEditor, {
                    //     contentBefore: '<p>[<br>]</p>',
                    //     stepFunction: insertLineBreak,
                    //     contentAfter: '<p><br>[]<br></p>',
                    // });
                    // TODO to check: the cursor cannot be in that position...
                    // await testEditor(BasicEditor, {
                    //     contentBefore: '<p><br>[]</p>',
                    //     stepFunction: insertLineBreak,
                    //     contentAfter: '<p><br>[]<br></p>',
                    // });
                });
                it('should insert a <br> at the beggining of a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]abc</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]abc</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[] abc</p>',
                        stepFunction: insertLineBreak,
                        // The space should have been parsed away.
                        contentAfter: '<p><br>[]abc</p>',
                    });
                });
                it('should insert a <br> within text', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]cd</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p>ab<br>[]cd</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab []cd</p>',
                        stepFunction: insertLineBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible (because it's before a
                        // <br>).
                        // JW cAfter: '<p>ab&nbsp;<br>[]cd</p>',
                        contentAfter: '<p>ab <br>[]cd</p>', // Note: JW seems just wrong here...
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[] cd</p>',
                        stepFunction: insertLineBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible (because it's after a
                        // <br>).
                        contentAfter: '<p>ab<br>[]&nbsp;cd</p>',
                    });
                });
                it('should insert a line break (2 <br>) at the end of a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]</p>',
                        stepFunction: insertLineBreak,
                        // The second <br> is needed to make the first
                        // one visible.
                        contentAfter: '<p>abc<br>[]<br></p>',
                    });
                });
            });
            describe('Consecutive', () => {
                it('should insert two <br> at the beggining of an empty paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]<br></p>',
                        stepFunction: async (editor) => {
                            await insertLineBreak(editor);
                            await insertLineBreak(editor);
                        },
                        contentAfter: '<p><br><br>[]<br></p>',
                    });
                    // TODO this cannot actually be tested currently as a
                    // backspace/delete in that case is not even detected
                    // (no input event to rollback)
                    // await testEditor(BasicEditor, {
                    //     contentBefore: '<p>[<br>]</p>',
                    //     stepFunction: async (editor) => {
                    //         await insertLineBreak(editor);
                    //         await insertLineBreak(editor);
                    //     },
                    //     contentAfter: '<p><br><br>[]<br></p>',
                    // });
                    // TODO seems like a theoretical case, if needed it could
                    // be about checking at the start of the shift-enter if
                    // we are not between left-state BR and right-state block.
                    // await testEditor(BasicEditor, {
                    //     contentBefore: '<p><br>[]</p>',
                    //     stepFunction: async (editor) => {
                    //         await insertLineBreak(editor);
                    //         await insertLineBreak(editor);
                    //     },
                    //     contentAfter: '<p><br><br>[]<br></p>',
                    // });
                });
                it('should insert two <br> at the beggining of a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]abc</p>',
                        stepFunction: async (editor) => {
                            await insertLineBreak(editor);
                            await insertLineBreak(editor);
                        },
                        contentAfter: '<p><br><br>[]abc</p>',
                    });
                });
                it('should insert two <br> within text', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]cd</p>',
                        stepFunction: async (editor) => {
                            await insertLineBreak(editor);
                            await insertLineBreak(editor);
                        },
                        contentAfter: '<p>ab<br><br>[]cd</p>',
                    });
                });
                it('should insert two line breaks (3 <br>) at the end of a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]</p>',
                        stepFunction: async (editor) => {
                            await insertLineBreak(editor);
                            await insertLineBreak(editor);
                        },
                        // the last <br> is needed to make the first one
                        // visible.
                        contentAfter: '<p>abc<br><br>[]<br></p>',
                    });
                });
            });
            describe('Format', () => {
                it('should insert a <br> before a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]<b>def</b></p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p>abc<br><b>[]def</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        // That selection is equivalent to []<b>
                        contentBefore: '<p>abc<b>[]def</b></p>',
                        stepFunction: insertLineBreak,
                        // JW cAfter: '<p>abc<br><b>[]def</b></p>',
                        contentAfter: '<p>abc<b><br>[]def</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc <b>[]def</b></p>',
                        stepFunction: insertLineBreak,
                        // JW cAfter: '<p>abc&nbsp;<br><b>[]def</b></p>',
                        contentAfter: '<p>abc <b><br>[]def</b></p>', // Note: JW seems just wrong here
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc<b>[] def </b></p>',
                        stepFunction: insertLineBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible (because it's before a
                        // <br>).
                        // JW cAfter: '<p>abc<br><b>[]&nbsp;def</b></p>',
                        contentAfter: '<p>abc<b><br>[]&nbsp;def </b></p>',
                    });
                });
                it('should insert a <br> after a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc</b>[]def</p>',
                        stepFunction: insertLineBreak,
                        // JW cAfter: '<p><b>abc[]<br></b>def</p>',
                        contentAfter: '<p><b>abc</b><br>[]def</p>',
                    });
                    await testEditor(BasicEditor, {
                        // That selection is equivalent to </b>[]
                        contentBefore: '<p><b>abc[]</b>def</p>',
                        stepFunction: insertLineBreak,
                        // JW cAfter: '<p><b>abc[]<br></b>def</p>',
                        contentAfter: '<p><b>abc<br>[]</b>def</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc[]</b> def</p>',
                        stepFunction: insertLineBreak,
                        // The space is converted to a non-breaking space so
                        // it is visible (because it's after a <br>).
                        // Visually, the caret does show _after_ the line
                        // break.
                        // JW cAfter: '<p><b>abc[]<br></b>&nbsp;def</p>',
                        contentAfter: '<p><b>abc<br>[]</b>&nbsp;def</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc []</b>def</p>',
                        stepFunction: insertLineBreak,
                        // JW cAfter: '<p><b>abc&nbsp;[]<br></b>def</p>',
                        contentAfter: '<p><b>abc <br>[]</b>def</p>', // Note: JW seems wrong here
                    });
                });
                it('should insert a <br> at the beginning of a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]<b>abc</b></p>',
                        stepFunction: insertLineBreak,
                        // JW cAfter: '<p><b><br>[]abc</b></p>',
                        contentAfter: '<p><br><b>[]abc</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        // That selection is equivalent to []<b>
                        contentBefore: '<p><b>[]abc</b></p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><b><br>[]abc</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>[] abc</b></p>',
                        stepFunction: insertLineBreak,
                        // The space should have been parsed away.
                        contentAfter: '<p><b><br>[]abc</b></p>',
                    });
                });
                it('should insert a <br> within a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab[]cd</b></p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><b>ab<br>[]cd</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab []cd</b></p>',
                        stepFunction: insertLineBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible.
                        // JW cAfter: '<p><b>ab&nbsp;<br>[]cd</b></p>',
                        contentAfter: '<p><b>ab <br>[]cd</b></p>', // Note: JW seems just wrong here...
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab[] cd</b></p>',
                        stepFunction: insertLineBreak,
                        // The space is converted to a non-breaking
                        // space so it is visible.
                        contentAfter: '<p><b>ab<br>[]&nbsp;cd</b></p>',
                    });
                });
                it('should insert a line break (2 <br>) at the end of a format node', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc</b>[]</p>',
                        stepFunction: insertLineBreak,
                        // The second <br> is needed to make the first
                        // one visible.
                        // JW cAfter: '<p><b>abc<br>[]<br></b></p>',
                        contentAfter: '<p><b>abc</b><br>[]<br></p>',
                    });
                    await testEditor(BasicEditor, {
                        // That selection is equivalent to </b>[]
                        contentBefore: '<p><b>abc[]</b></p>',
                        stepFunction: insertLineBreak,
                        // The second <br> is needed to make the first
                        // one visible.
                        contentAfter: '<p><b>abc<br>[]<br></b></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc[] </b></p>',
                        stepFunction: insertLineBreak,
                        // The space should have been parsed away.
                        // The second <br> is needed to make the first
                        // one visible.
                        contentAfter: '<p><b>abc<br>[]<br></b></p>',
                    });
                });
            });
            describe('With attributes', () => {
                it('should insert a line break before a span with class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">dom to</span></p><p><span class="b">[]edit</span></p>',
                        stepFunction: insertLineBreak,
                        contentAfter:
                            '<p><span class="a">dom to</span></p><p><span class="b"><br>[]edit</span></p>',
                    });
                });
                it('should insert a line break within a span with a bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><span><b>ab[]cd</b></span></p>',
                        stepFunction: insertLineBreak,
                        contentAfter:
                            '<p><span><b>ab<br>[]cd</b></span></p>',
                    });
                });
            });
        });
        describe('Selection not collapsed', () => {
            it('should delete the first half of a paragraph, then insert a <br>', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[ab]cd</p>',
                    stepFunction: insertLineBreak,
                    contentAfter: '<p><br>[]cd</p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]ab[cd</p>',
                    stepFunction: insertLineBreak,
                    contentAfter: '<p><br>[]cd</p>',
                });
            });
            it('should delete part of a paragraph, then insert a <br>', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[bc]d</p>',
                    stepFunction: insertLineBreak,
                    contentAfter: '<p>a<br>[]d</p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a]bc[d</p>',
                    stepFunction: insertLineBreak,
                    contentAfter: '<p>a<br>[]d</p>',
                });
            });
            it('should delete the last half of a paragraph, then insert a line break (2 <br>)', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[cd]</p>',
                    stepFunction: insertLineBreak,
                    // the second <br> is needed to make the first one
                    // visible.
                    contentAfter: '<p>ab<br>[]<br></p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab]cd[</p>',
                    stepFunction: insertLineBreak,
                    // the second <br> is needed to make the first one
                    // visible.
                    contentAfter: '<p>ab<br>[]<br></p>',
                });
            });
            it('should delete all contents of a paragraph, then insert a line break', async () => {
                // Forward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abcd]</p>',
                    stepFunction: insertLineBreak,
                    contentAfter: '<p><br>[]<br></p>',
                });
                // Backward selection
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abcd[</p>',
                    stepFunction: insertLineBreak,
                    contentAfter: '<p><br>[]<br></p>',
                });
            });
        });
    });

    it('should not delete content from the vdom', async () => {
        await testVdom(BasicEditor, {
            contentBefore: '<p><b>a[b]c</b></p>',
            stepFunction: toggleBold,
            contentAfter: '<p><b>a</b>b<b>c</b></p>',
        })
    })
});

/**
 * Quick UI to launch tests from the test web page.
 */
const startTestsButtonEl = document.getElementById('start-tests');
startTestsButtonEl.addEventListener('click', () => {
    startTestsButtonEl.disabled = true;
    const mochaEl = document.createElement('div');
    mochaEl.id = 'mocha';
    document.body.appendChild(mochaEl);
    window.mocha.run(() => {
        const reportEl = document.getElementById('mocha-report');
        window.scrollTo(0, window.scrollY + reportEl.getBoundingClientRect().top);
    });
    document.getElementById('control-panel').remove();
});