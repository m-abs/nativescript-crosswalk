/// <reference path="./node_modules/tns-platform-declarations/android17.d.ts" />
import {XWalkWebViewBase, JavaScriptCallback} from './xwalkwebview-common';

export declare namespace org {
  export namespace xwalk {
    export namespace core {
      export class XWalkView {
        constructor(context: any);
        setResourceClient(client: XWalkResourceClient);
        addJavascriptInterface(object: Object, name: string);
        canZoomIn(): boolean;
        canZoomOut(): boolean;
        clearCache(includeDiskFiles: boolean);
        evaluateJavascript(script: string, callback: JavaScriptCallback);
        getAPIVersion(): string;
        getNavigationHistory(): XWalkNavigationHistory;
        getOriginalUrl(): string;
        getRemoteDebuggingUrl(): any;
        getTitle(): string;
        getUrl(): string;
        getXWalkVersion(): string;
        hasEnteredFullscreen(): boolean;
        leaveFullscreen();
        load(url: string, content: string);
        loadAppFromManifest(url: string, content: string)
        onActivityResult(requestCode: number, resultCode: number, data: android.content.Intent);
        onCreateInputConnection(outAttrs: android.view.inputmethod.EditorInfo): any;
        onDestroy();
        onHide();
        onNewIntent(intent: android.content.Intent): boolean;
        onShow();
        pauseTimers();
        reload(mode: number);
        restoreState(inState: android.os.Bundle): boolean;
        resumeTimers();
        saveState(outState: android.os.Bundle);
        setBackgroundColor(color: number);
        setDownloadListener(listener: XWalkDownloadListener);
        setLayerType(layerType: number, paint: android.graphics.Paint);
        setNetworkAvailable(networkUp: boolean);
        setResourceClient(client: XWalkResourceClient);
        setUIClient(client: XWalkUIClient);
        setUserAgentString(userAgent: string);
        setZOrderOnTop(onTop: boolean);
        stopLoading();
        zoomBy(factor: number);
        zoomIn(): boolean;
        zoomOut(): boolean;
        destroy();
      }

      export class XWalkResourceClient {
        constructor(view: XWalkView);
        onPageStarted(view: XWalkView, url: string, favicon: android.graphics.Bitmap);
        onPageFinished(view: XWalkView, url: string);
        onReceivedLoadError(view: XWalkView, errorCode: number, description: string, failingUrl: string);
        onReceivedSslError(view: XWalkView, callback: (value: boolean) => void, error: android.net.http.SslError);
      }

      export class XWalkDownloadListener {
      }

      export class XWalkUIClient {
      }

      export class XWalkNavigationHistory {
        static Direction: any;
        canGoBack(): boolean;
        canGoForward(): boolean;
        clear();
        getCurrentIndex(): number;
        getCurrentItem(): any;
        getItemAt(index: number): any;
        hasItemAt(index: number): boolean;
        navigate(direction: any /*XWalkNavigationHistory.Direction*/, steps: number);
        size(): number;
      }
    }
  }
};

import * as trace from 'trace';
import * as fs from 'file-system';

let WebViewClientClass;
function ensureWebViewClientClass() {
  if (WebViewClientClass) {
    return;
  }

  class WebViewClientClassInner extends org.xwalk.core.XWalkResourceClient {
    private _view: XWalkWebView;

    constructor(view: XWalkWebView) {
      super(view.android);

      this._view = view;
      const res = global.__native(this);

      return res;
    }

    public shouldOverrideUrlLoading(view: org.xwalk.core.XWalkView, url: string) {
      if (trace.enabled) {
        trace.write('WebViewClientClass.shouldOverrideUrlLoading(' + url + ')', trace.categories.Debug);
      }
      return false;
    }

    public onPageStarted(view: org.xwalk.core.XWalkView, url: string, favicon: android.graphics.Bitmap) {
      super.onPageStarted(view, url, favicon);

      if (this._view) {
        if (trace.enabled) {
          trace.write('WebViewClientClass.onPageStarted(' + url + ', ' + favicon + ')', trace.categories.Debug);
        }
        this._view._onLoadStarted(url, XWalkWebViewBase.navigationTypes[XWalkWebViewBase.navigationTypes.indexOf('linkClicked')]);
      }
    }

    public onPageFinished(view: org.xwalk.core.XWalkView, url: string) {
      super.onPageFinished(view, url);

      if (this._view) {
        if (trace.enabled) {
          trace.write('WebViewClientClass.onPageFinished(' + url + ')', trace.categories.Debug);
        }
        this._view._onLoadFinished(url, undefined);
      }
    }

    public onReceivedLoadError(view: org.xwalk.core.XWalkView, errorCode: number, description: string, failingUrl: string) {
      super.onReceivedLoadError(view, errorCode, description, failingUrl);

      if (this._view) {
        if (trace.enabled) {
          trace.write(`WebViewClientClass.onReceivedLoadError(${errorCode}, ${description}, ${failingUrl})`, trace.categories.Debug);
        }

        this._view._onLoadFinished(failingUrl, `${description} (${errorCode})`);
      }
    }

    public onReceivedSslError(view: org.xwalk.core.XWalkView, callback: (value: boolean) => void, error: android.net.http.SslError) {
      super.onReceivedSslError(view, callback, error);

      const errorCode = error.getPrimaryError();
      let label: string;
      switch (errorCode) {
        case android.net.http.SslError.SSL_DATE_INVALID: {
          label = 'SSL_DATE_INVALID';
          break;
        }
        case android.net.http.SslError.SSL_EXPIRED: {
          label = 'SSL_EXPIRED';
          break;
        }
        case android.net.http.SslError.SSL_IDMISMATCH: {
          label = 'SSL_IDMISMATCH';
          break;
        }
        case android.net.http.SslError.SSL_INVALID: {
          label = 'SSL_INVALID';
          break;
        }
        case android.net.http.SslError.SSL_MAX_ERROR: {
          label = 'SSL_MAX_ERROR';
          break;
        }
        case android.net.http.SslError.SSL_NOTYETVALID: {
          label = 'SSL_NOTYETVALID';
          break;
        }
        case android.net.http.SslError.SSL_UNTRUSTED: {
          label = 'SSL_UNTRUSTED';
          break;
        }
      }

      const url = error.getUrl();

      if (this._view) {
        if (trace.enabled) {
          trace.write(`WebViewClientClass.onReceivedError(${errorCode}, ${label}, ${url})`, trace.categories.Debug);
        }

        this._view._onLoadFinished(url, `${label} (${errorCode})`);
      }
    }
  };

  WebViewClientClass = WebViewClientClassInner;
}

export class XWalkWebView extends XWalkWebViewBase {
  private _android: org.xwalk.core.XWalkView;
  private _xWalkResourceClient: org.xwalk.core.XWalkResourceClient;

  constructor() {
    super();
  }

  get android() {
    return this._android;
  }

  public _createUI() {
    console.log('_createUI');
    this._android = new org.xwalk.core.XWalkView((<any>this)._context);

    ensureWebViewClientClass();
    this._xWalkResourceClient = new WebViewClientClass(this);
    /*
    this._android.getSettings().setJavaScriptEnabled(true);
    this._android.getSettings().setBuiltInZoomControls(true);
    */
    this.android.setResourceClient(this._xWalkResourceClient);
  }

  public _onDetached(force?: boolean) {
    if (this.android) {
      this.android.destroy();
    }

    super._onDetached(force);
  }

  public _loadUrl(url: string) {
    if (!this.android) {
      return;
    }

    if (trace.enabled) {
      trace.write('WebView._loadUrl(' + url + ')', trace.categories.Debug);
    }
    this.android.stopLoading();
    this.android.load(url, null);
  }

  public _loadFileOrResource(path: string, content: string) {
    if (!this.android) {
      return;
    }

    const baseUrl = `file:///${path.substring(0, path.lastIndexOf('/') + 1)}`;
    this.android.load(baseUrl, content);
  }

  public _loadHttp(src: string) {
    if (!this.android) {
      return;
    }

    this.android.load(src, null);
  }

  public _loadData(src: string) {
    if (!this.android) {
      return;
    }

    const baseUrl = `file:///${fs.knownFolders.currentApp().path}/`;
    this.android.load(baseUrl, null);
  }

  private get history(): org.xwalk.core.XWalkNavigationHistory {
    return this.android.getNavigationHistory();
  }

  get canGoBack(): boolean {
    return this.history.canGoBack();
  }

  public stopLoading() {
    if (this.android) {
      this.android.stopLoading();
    }
  }

  get canGoForward(): boolean {
    return this.history.canGoForward();
  }

  public goBack() {
    this.history.navigate(org.xwalk.core.XWalkNavigationHistory.Direction.BACKWARDS, 1);
  }

  public goForward() {
    this.history.navigate(org.xwalk.core.XWalkNavigationHistory.Direction.FORWARDS, 1);
  }

  public reload() {
    this.android.reload(0);
  }

  public addJavascriptInterface(object: Object, name: string): void {
    return this.android.addJavascriptInterface(object, name);
  }

  public evaluateJavascript(evalString: string, cb: JavaScriptCallback): void {
    return this.android.evaluateJavascript(evalString, cb);
  }

  public clearCache(includeDiskFiles: boolean): void {
    return this.android.clearCache(includeDiskFiles);
  }

  public pauseTimers(): void {
    return this.android.pauseTimers();
  }

  public resumeTimers(): void {
    return this.android.resumeTimers();
  }
}
