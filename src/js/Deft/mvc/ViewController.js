// Generated by CoffeeScript 1.3.3
/*
Copyright (c) 2012 [DeftJS Framework Contributors](http://deftjs.org)
Open source under the [MIT License](http://en.wikipedia.org/wiki/MIT_License).
*/

/**
A lightweight MVC view controller.

Used in conjunction with {@link Deft.mixin.Controllable}.
*/

Ext.define('Deft.mvc.ViewController', {
  alternateClassName: ['Deft.ViewController'],
  requires: ['Deft.log.Logger', 'Deft.mvc.ComponentSelector', 'Deft.mvc.Observer'],
  config: {
    /**
    		View controlled by this ViewController.
    */

    view: null
  },
  /**
  	Observers automatically created and removed by this ViewController.
  */

  observe: {},
  constructor: function(config) {
    var initializedConfig;
    if (config == null) {
      config = {};
    }
    if (config.view) {
      this.controlView(config.view);
    }
    initializedConfig = this.initConfig(config);
    if (Ext.Object.getSize(this.observe) > 0) {
      this.createObservers();
    }
    return initializedConfig;
  },
  /**
  	@protected
  */

  controlView: function(view) {
    if (view instanceof Ext.ClassManager.get('Ext.Container')) {
      this.setView(view);
      this.registeredComponentReferences = {};
      this.registeredComponentSelectors = {};
      if (Ext.getVersion('extjs') != null) {
        if (this.getView().rendered) {
          this.onViewInitialize();
        } else {
          this.getView().on('afterrender', this.onViewInitialize, this, {
            single: true
          });
        }
      } else {
        if (this.getView().initialized) {
          this.onViewInitialize();
        } else {
          this.getView().on('initialize', this.onViewInitialize, this, {
            single: true
          });
        }
      }
    } else {
      Ext.Error.raise({
        msg: 'Error constructing ViewController: the configured \'view\' is not an Ext.Container.'
      });
    }
  },
  /**
  	Initialize the ViewController
  */

  init: function() {},
  /**
  	Destroy the ViewController
  */

  destroy: function() {
    var id, selector;
    for (id in this.registeredComponentReferences) {
      this.removeComponentReference(id);
    }
    for (selector in this.registeredComponentSelectors) {
      this.removeComponentSelector(selector);
    }
    this.removeObservers();
    return true;
  },
  /**
  	@private
  */

  onViewInitialize: function() {
    var config, id, listeners, live, originalViewDestroyFunction, selector, self, _ref;
    if (Ext.getVersion('extjs') != null) {
      this.getView().on('beforedestroy', this.onViewBeforeDestroy, this);
    } else {
      self = this;
      originalViewDestroyFunction = this.getView().destroy;
      this.getView().destroy = function() {
        if (self.destroy()) {
          originalViewDestroyFunction.call(this);
        }
      };
    }
    _ref = this.control;
    for (id in _ref) {
      config = _ref[id];
      selector = null;
      if (id !== 'view') {
        if (Ext.isString(config)) {
          selector = config;
        } else if (config.selector != null) {
          selector = config.selector;
        } else {
          selector = '#' + id;
        }
      }
      listeners = null;
      if (Ext.isObject(config.listeners)) {
        listeners = config.listeners;
      } else {
        if (!((config.selector != null) || (config.live != null))) {
          listeners = config;
        }
      }
      live = (config.live != null) && config.live;
      this.addComponentReference(id, selector, live);
      this.addComponentSelector(selector, listeners, live);
    }
    this.init();
  },
  /**
  	@private
  */

  onViewBeforeDestroy: function() {
    if (this.destroy()) {
      this.getView().un('beforedestroy', this.onBeforeDestroy, this);
      return true;
    }
    return false;
  },
  /**
  	Add a component accessor method the ViewController for the specified view-relative selector.
  */

  addComponentReference: function(id, selector, live) {
    var getterName, matches;
    if (live == null) {
      live = false;
    }
    Deft.Logger.log("Adding '" + id + "' component reference for selector: '" + selector + "'.");
    if (this.registeredComponentReferences[id] != null) {
      Ext.Error.raise({
        msg: "Error adding component reference: an existing component reference was already registered as '" + id + "'."
      });
    }
    if (id !== 'view') {
      getterName = 'get' + Ext.String.capitalize(id);
      if (this[getterName] == null) {
        if (live) {
          this[getterName] = Ext.Function.pass(this.getViewComponent, [selector], this);
        } else {
          matches = this.getViewComponent(selector);
          if (matches == null) {
            Ext.Error.raise({
              msg: "Error locating component: no component(s) found matching '" + selector + "'."
            });
          }
          this[getterName] = function() {
            return matches;
          };
        }
        this[getterName].generated = true;
      }
    }
    this.registeredComponentReferences[id] = true;
  },
  /**
  	Remove a component accessor method the ViewController for the specified view-relative selector.
  */

  removeComponentReference: function(id) {
    var getterName;
    Deft.Logger.log("Removing '" + id + "' component reference.");
    if (this.registeredComponentReferences[id] == null) {
      Ext.Error.raise({
        msg: "Error removing component reference: no component reference is registered as '" + id + "'."
      });
    }
    if (id !== 'view') {
      getterName = 'get' + Ext.String.capitalize(id);
      if (this[getterName].generated) {
        this[getterName] = null;
      }
    }
    delete this.registeredComponentReferences[id];
  },
  /**
  	Get the component(s) corresponding to the specified view-relative selector.
  */

  getViewComponent: function(selector) {
    var matches;
    if (selector != null) {
      matches = Ext.ComponentQuery.query(selector, this.getView());
      if (matches.length === 0) {
        return null;
      } else if (matches.length === 1) {
        return matches[0];
      } else {
        return matches;
      }
    } else {
      return this.getView();
    }
  },
  /**
  	Add a component selector with the specified listeners for the specified view-relative selector.
  */

  addComponentSelector: function(selector, listeners, live) {
    var componentSelector, existingComponentSelector;
    if (live == null) {
      live = false;
    }
    Deft.Logger.log("Adding component selector for: '" + selector + "'.");
    existingComponentSelector = this.getComponentSelector(selector);
    if (existingComponentSelector != null) {
      Ext.Error.raise({
        msg: "Error adding component selector: an existing component selector was already registered for '" + selector + "'."
      });
    }
    componentSelector = Ext.create('Deft.mvc.ComponentSelector', {
      view: this.getView(),
      selector: selector,
      listeners: listeners,
      scope: this,
      live: live
    });
    this.registeredComponentSelectors[selector] = componentSelector;
  },
  /**
  	Remove a component selector with the specified listeners for the specified view-relative selector.
  */

  removeComponentSelector: function(selector) {
    var existingComponentSelector;
    Deft.Logger.log("Removing component selector for '" + selector + "'.");
    existingComponentSelector = this.getComponentSelector(selector);
    if (existingComponentSelector == null) {
      Ext.Error.raise({
        msg: "Error removing component selector: no component selector registered for '" + selector + "'."
      });
    }
    existingComponentSelector.destroy();
    delete this.registeredComponentSelectors[selector];
  },
  /**
  	Get the component selectorcorresponding to the specified view-relative selector.
  */

  getComponentSelector: function(selector) {
    return this.registeredComponentSelectors[selector];
  },
  /**
  	@protected
  */

  createObservers: function() {
    var events, target, _ref;
    this.registeredObservers = {};
    _ref = this.observe;
    for (target in _ref) {
      events = _ref[target];
      this.addObserver(target, events);
    }
  },
  addObserver: function(target, events) {
    var observer;
    observer = Ext.create('Deft.mvc.Observer', {
      host: this,
      target: target,
      events: events
    });
    return this.registeredObservers[target] = observer;
  },
  /**
  	@protected
  */

  removeObservers: function() {
    var observer, target, _ref;
    _ref = this.registeredObservers;
    for (target in _ref) {
      observer = _ref[target];
      observer.destroy();
      delete this.registeredObservers[target];
    }
  }
});

/**
Preprocessor to handle merging of 'observe' objects on parent and child classes.
*/


Deft.Class.registerPreprocessor('observe', function(Class, data, hooks, callback) {
  Deft.Class.hookOnClassExtended(data, function(Class, data, hooks) {
    var _ref;
    if (Class.superclass && ((_ref = Class.superclass) != null ? _ref.observe : void 0) && Deft.Class.extendsClass('Deft.mvc.ViewController', Class)) {
      data.observe = Deft.mvc.Observer.mergeObserve(Class.superclass.observe, data.observe);
    }
  });
}, 'before', 'extend');
