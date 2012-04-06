/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, waits: false, runs: false, $: false*/

define(function (require, exports, module) {
    'use strict';

    var SpecRunnerUtils = require("./SpecRunnerUtils.js"),
        NativeApp       = require("utils/NativeApp"),
        LiveDevelopment,    //The following are all loaded from the test window
        Inspector,
        DocumentManager;
    
    var testPath = SpecRunnerUtils.getTestPath("/spec/LiveDevelopment-test-files"),
        testWindow,
        allSpacesRE = /\s+/gi;
    
    function fixSpaces(str) {
        return str.replace(allSpacesRE, " ");
    }

    describe("Live Development", function () {
        
        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow          = w;
                LiveDevelopment     = testWindow.brackets.test.LiveDevelopment;
                Inspector           = testWindow.brackets.test.Inspector;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
            });
            
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
        });
    
    
        afterEach(function () {
            LiveDevelopment.close();
            SpecRunnerUtils.closeTestWindow();
        });
        
        describe("CSS Editing", function () {

            it("should establish a browser connection for an opened html file", function () {
                //verify we aren't currently connected
                expect(Inspector.connected()).toBeFalsy();
                
                //open a file
                var htmlOpened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.html"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.html");
                    }).always(function () {
                        htmlOpened = true;
                    });
                });
                waitsFor(function () { return htmlOpened; }, "htmlOpened FILE_OPEN timeout", 1000);
                
                //start the connection
                runs(function () {
                    LiveDevelopment.open();
                });
                waitsFor(function () { return Inspector.connected(); }, "Waiting for browser", 10000);
 
                runs(function () {
                    expect(Inspector.connected()).toBeTruthy();
                });
            });
            
            it("should should not start a browser connection for an opened css file", function () {
                //verify we aren't currently connected
                expect(Inspector.connected()).toBeFalsy();
                
                //open a file
                var opened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.css"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.css");
                    }).always(function () {
                        opened = true;
                    });
                });
                waitsFor(function () { return opened; }, "FILE_OPEN timeout", 1000);
                
                //start the connection
                runs(function () {
                    LiveDevelopment.open();
                });
                
                //we just need to wait an arbitrary time since we can't check for the connection to be true
                waits(5000);
 
                runs(function () {
                    expect(Inspector.connected()).toBeFalsy();
                });
            });
            
            it("should push changes through the browser connection", function () {
                var curDoc,
                    curText,
                    browserText;
                
                //verify we aren't currently connected
                expect(Inspector.connected()).toBeFalsy();
                
                var htmlOpened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.html"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.html");
                    }).always(function () {
                        htmlOpened = true;
                    });
                });
                waitsFor(function () { return htmlOpened; }, "htmlOpened FILE_OPEN timeout", 1000);
                
                //start the connection
                runs(function () {
                    LiveDevelopment.open();
                });
                waitsFor(function () { return Inspector.connected(); }, "Waiting for browser", 10000);
                
                var cssOpened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.css"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.css");
                    }).always(function () {
                        cssOpened = true;
                    });
                });
                waitsFor(function () { return cssOpened; }, "cssOpened FILE_OPEN timeout", 1000);
                
                runs(function () {
                    curDoc =  DocumentManager.getCurrentDocument();
                    curText = curDoc.getText();
                    curText += "\n .testClass { color:#090; }\n";
                    curDoc.setText(curText);
                });
                
                //add a wait for the change to get pushed, then wait to get the result
                waits(1000);
                
                var doneSyncing = false;
                runs(function () {
                    curDoc.liveDevelopment.liveDoc.getSourceFromBrowser().done(function (text) {
                        browserText = text;
                    }).always(function () {
                        doneSyncing = true;
                    });
                });
                waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 10000);
                
                runs(function () {
                    expect(fixSpaces(browserText)).toBe(fixSpaces(curText));
                });
            });
            
            it("should push in memory css changes made before the session starts", function () {
                var curDoc,
                    curText,
                    browserText;
                
                //verify we aren't currently connected
                expect(Inspector.connected()).toBeFalsy();
                
                var cssOpened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.css"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.css");
                    }).always(function () {
                        cssOpened = true;
                    });
                });
                waitsFor(function () { return cssOpened; }, "cssOpened FILE_OPEN timeout", 1000);
                
                runs(function () {
                    curDoc =  DocumentManager.getCurrentDocument();
                    curText = curDoc.getText();
                    curText += "\n .testClass { color:#090; }\n";
                    curDoc.setText(curText);
                    curDoc.addRef();
                });
                
                var htmlOpened = false;
                runs(function () {
                    SpecRunnerUtils.openProjectFiles(["simple1.html"]).fail(function () {
                        expect("Failed To Open").toBe("simple1.html");
                    }).always(function () {
                        htmlOpened = true;
                    });
                });
                waitsFor(function () { return htmlOpened; }, "htmlOpened FILE_OPEN timeout", 1000);
                
                //start the connection
                runs(function () {
                    LiveDevelopment.open();
                });
                waitsFor(function () { return Inspector.connected(); }, "Waiting for browser", 10000);
                
                var doneSyncing = false;
                runs(function () {
                    curDoc.liveDevelopment.liveDoc.getSourceFromBrowser().done(function (text) {
                        browserText = text;
                    }).always(function () {
                        doneSyncing = true;
                        curDoc.releaseRef();
                    });
                });
                waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 10000);
                
                runs(function () {
                    expect(fixSpaces(browserText)).toBe(fixSpaces(curText));
                });
            });
        });
    });
});
