import {WebView as IWebView, LoadEventData} from 'ui/web-view';
import {View} from 'ui/core/view';
import dependencyObservable = require('ui/core/dependency-observable');
import proxy = require('ui/core/proxy');
import * as utils from 'utils/utils';
import * as trace from 'trace';
import * as fileSystemModule from 'file-system';

let fs: typeof fileSystemModule;
function ensureFS() {
  if (!fs) {
    fs = require('file-system');
  }
}

const urlProperty = new dependencyObservable.Property(
  'url',
  'XWalkWebViewBase',
  new proxy.PropertyMetadata('')
);

function onUrlPropertyChanged(data: dependencyObservable.PropertyChangeData) {
  const webView = <XWalkWebViewBase>data.object;

  if (webView._suspendLoading) {
    return;
  }

  webView._loadUrl(data.newValue);
}

// register the setNativeValue callback
(<proxy.PropertyMetadata>urlProperty.metadata).onSetNativeValue = onUrlPropertyChanged;

const srcProperty = new dependencyObservable.Property(
  'src',
  'XWalkWebViewBase',
  new proxy.PropertyMetadata('')
);

function onSrcPropertyChanged(data: dependencyObservable.PropertyChangeData) {
  const webView = <XWalkWebViewBase>data.object;

  if (webView._suspendLoading) {
    return;
  }

  webView.stopLoading();

  let src = <string>data.newValue;
  trace.write(`XWalkWebViewBase._loadSrc(${src})`, trace.categories.Debug);

  if (utils.isFileOrResourcePath(src)) {
    ensureFS();

    if (src.indexOf('~/') === 0) {
      src = fs.path.join(fs.knownFolders.currentApp().path, src.replace('~/', ''));
    }

    if (fs.File.exists(src)) {
      const file = fs.File.fromPath(src);
      const content = file.readTextSync();
      webView._loadFileOrResource(src, content);
    }
  } else if (src.toLowerCase().indexOf('http://') === 0 || src.toLowerCase().indexOf('https://') === 0) {
    webView._loadHttp(src);
  } else {
    webView._loadData(src);
  }
}

// register the setNativeValue callback
(<proxy.PropertyMetadata>srcProperty.metadata).onSetNativeValue = onSrcPropertyChanged;

export interface urlOverrideHandlerFn {
  (url: String): boolean;
};

export interface JavaScriptCallback {
  <T>(value: T): void;
}

export abstract class XWalkWebViewBase extends View implements IWebView {
  public static loadStartedEvent = 'loadStarted';
  public static loadFinishedEvent = 'loadFinished';

  public static urlProperty = urlProperty;
  public static srcProperty = srcProperty;

  public _suspendLoading: boolean;

  constructor() {
    super();
  }

  get url(): string {
    return this._getValue(XWalkWebViewBase.urlProperty);
  }

  set url(value: string) {
    this._setValue(XWalkWebViewBase.urlProperty, value);
  }

  get src(): string {
    return this._getValue(XWalkWebViewBase.srcProperty);
  }

  set src(value: string) {
    this._setValue(XWalkWebViewBase.srcProperty, value);
  }

  public _onLoadFinished(url: string, error?: string) {
    this._suspendLoading = true;
    this.url = url;
    this._suspendLoading = false;

    const args = <LoadEventData>{
      eventName: XWalkWebViewBase.loadFinishedEvent,
      object: this,
      url,
      error,
      navigationType: undefined,
    };

    this.notify(args);
  }

  public _onLoadStarted(url: string, navigationType: string) {
    const args = <LoadEventData>{
      eventName: XWalkWebViewBase.loadStartedEvent,
      object: this,
      url: url,
      error: undefined,
      navigationType,
    };

    this.notify(args);
  }

  abstract _loadUrl(url: string): void;

  abstract _loadFileOrResource(path: string, content: string): void;

  abstract _loadHttp(src: string): void;

  abstract _loadData(src: string): void;

  abstract stopLoading(): void;

  get canGoBack(): boolean {
    throw new Error('This member is abstract.');
  }

  get canGoForward(): boolean {
    throw new Error('This member is abstract.');
  }

  abstract goBack(): void;

  abstract goForward(): void;

  abstract reload(): void;

  abstract addJavascriptInterface(object: Object, name: string): void;

  abstract evaluateJavascript(evalString: string, cb: JavaScriptCallback): void;

  abstract clearCache(includeDiskFiles: boolean): void;

  abstract pauseTimers(): void;

  abstract resumeTimers(): void;

  protected _urlOverrideHandler: urlOverrideHandlerFn;

  set urlOverrideHandler(fn: urlOverrideHandlerFn) {
    this._urlOverrideHandler = fn;
  }

  get urlOverrideHandler(): urlOverrideHandlerFn {
    return this._urlOverrideHandler;
  }

  public _onDetached(force?: boolean) {
    super._onDetached(force);
  }

  public static navigationTypes = [
    'linkClicked',
    'formSubmitted',
    'backForward',
    'reload',
    'formResubmitted',
    'other',
  ];
}
