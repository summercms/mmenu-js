import Mmenu from '../../core/oncanvas/mmenu.oncanvas';
import OPTIONS from './options';
import CONFIGS from './configs';
import translate from './translations';

import * as DOM from '../../_modules/dom';
import * as events from '../../_modules/eventlisteners';
import { type, extend } from '../../_modules/helpers';

//  Add the translations.
translate();

export default function (this: Mmenu) {
    this.opts.searchfield = this.opts.searchfield || {};
    this.conf.searchfield = this.conf.searchfield || {};

    //	Extend options.
    const options = extend(this.opts.searchfield, OPTIONS);
    const configs = extend(this.conf.searchfield, CONFIGS);

    if (!options.add) {
        return;
    }

    //  Add a searchfield to panels matching the querySelector.
    this.bind('initPanel:after', (panel: HTMLElement) => {
        if (panel.matches(options.addTo) &&
            !panel.closest('.mm-listitem--vertical')
        ) {
            initPanel.call(this, panel);
        }
    });

    //  Add a searchfield to a searchpanel.
    if (options.addTo === '.mm-panel--search') {
        this.bind('initMenu:after', () => {
            createPanel.call(this);
        })
    }

    //	Blur searchfield
    // this.bind('close:after', () => {
    //     DOM.find(this.node.menu, '.mm-searchfield').forEach((input) => {
    //         input.blur();
    //     });
    // });
    

    //	Add click behavior.
    //	Prevents default behavior when clicking an anchor
    // this.clck.push((anchor: HTMLElement, args: mmClickArguments) => {
    //     if (args.inMenu) {
    //         if (anchor.matches('.mm-searchfield__btn')) {
    //            
    //         }
    //     }
    // });
}

/**
 * Add a searchfield, splash message and no-results message to a panel.
 * @param this {Mmenu}
 * @param panel {HTMLElement} The panel to initialise.
 * @returns 
 */
const initPanel = function(
    this: Mmenu, 
    panel: HTMLElement
) {
    const options = this.opts.searchfield;
    const configs = this.conf.searchfield;

    /** 
     * Add array of attributes to an element.
     * @param element {HTMLEement} The element to add the attributes to.
     * @param attributes {Object} The attributes to add.
     */
    const addAttributes = (
        element: HTMLElement,
        attributes: mmLooseObject | boolean
    ) => {
        if (attributes) {
            Object.keys(attributes).forEach(a => {
                element[a] = attributes[a];
            })
        }
    };

    //	Only one searchfield per panel.
    if (DOM.find(panel, '.mm-searchfield').length) {
        return;
    }
    
    /** The form node. */
    const form = DOM.create((configs.form ? 'form' : 'div') + '.mm-searchfield');

    /** The fieldset node. */
    const field = DOM.create('div.mm-searchfield__input');
    form.append(field);

    /** The input node. */
    const input = DOM.create('input') as HTMLInputElement;
    field.append(input);

    //	Add attributes to the form
    addAttributes(form, configs.form);

    //	Add attributes to the input
    input.type = 'text';
    input.autocomplete = 'off';
    input.placeholder = this.i18n(options.placeholder);
    addAttributes(input, configs.input);

    //	Add a button to submit to the form.
    if (configs.form && configs.submit) {

        /** The submit button. */
        const submit = DOM.create('button.mm-btnreset.mm-btn.mm-btn--next.mm-searchfield__btn') as HTMLButtonElement;
        submit.type = 'submit';

        field.append(submit);
    }

    //	Add a button to clear the searchfield.
    else if (configs.clear) {

        /** The reset button. */
        const reset = DOM.create('button.mm-btnreset.mm-btn.mm-btn--close.mm-searchfield__btn') as HTMLButtonElement;
        reset.type = 'reset';

        field.append(reset);
    }

    //  TODO: wanneer en waarom? wat doet ie?
    //  Add a button to close the searchpanel.
    if ( configs.cancel ) {

        /** The cancel button. */
        const cancel = DOM.create('a.mm-searchfield__cancel') as HTMLAnchorElement;
        cancel.textContent = this.i18n('cancel');

        form.append(cancel);

        this.bind('openPanel:before', panel => {
            if (!panel.matches('.mm-panel--search')) {
                cancel.href = `#${panel.id}`;
            }
        });
    }
    
    //  Add the form to the panel.
    panel.prepend(form);



    // //	Add splash content
    //  Only once

    // if (options.panel.splash) {
    //     let splash = DOM.create('div.mm-panel__content');
    //     splash.innerHTML = options.panel.splash;

    //     searchpanel.append(splash);
    // }



    //  //  Add no results message
    //	Only once
    // if (DOM.children(wrapper, '.mm-panel__noresultsmsg').length) {
    //     return;
    // }

    // //	Add no-results message
    // var message = DOM.create('div.mm-panel__noresultsmsg.mm-hidden');
    // message.innerHTML = this.i18n(options.noResults) as string;

    // wrapper.append(message);
};

/**
 * Create the searchpanel.
 * @param this {Mmenu}
 */
const createPanel = function (
    this: Mmenu
) {

    const options = this.opts.searchfield;

    //	Only once
    if (DOM.children(this.node.pnls, '.mm-panel--search').length) {
        return;
    }

    /** The panel. */
    const panel = DOM.create('div.mm-panel--search');
    
    //  TODO: via config?
    panel.id = 'panel-search';

    //  TODO: "search" vertaalbaar?
    if (options.title) {
        panel.dataset.mmTitle = this.i18n(options.title);
    }

    /** The listview for the searchresults. */
    const listview = DOM.create('ul');
    panel.append(listview);

    this._initPanel(panel);
};


const initSearching = function (this: Mmenu, form: HTMLElement) {
    var options = this.opts.searchfield,
        configs = this.conf.searchfield;

    var data: mmLooseObject = {};

    //	In the searchpanel.
    if (form.closest('.mm-panel_search')) {
        data.panels = DOM.find(this.node.pnls, '.mm-panel');
        data.noresults = [form.closest('.mm-panel')];

        //	In a panel
    } else if (form.closest('.mm-panel')) {
        data.panels = [form.closest('.mm-panel')];
        data.noresults = data.panels;

        //	Not in a panel, global
    } else {
        data.panels = DOM.find(this.node.pnls, '.mm-panel');
        data.noresults = [this.node.menu];
    }

    //	Filter out search panel
    data.panels = data.panels.filter(
        (panel) => !panel.matches('.mm-panel_search')
    );

    //	Filter out vertical submenus
    data.panels = data.panels.filter(
        (panel) => !panel.parentElement.matches('.mm-listitem--vertical')
    );

    //  Find listitems and dividers.
    data.listitems = [];
    data.dividers = [];
    data.panels.forEach((panel) => {
        data.listitems.push(...DOM.find(panel, '.mm-listitem'));
        data.dividers.push(...DOM.find(panel, '.mm-divider'));
    });

    var searchpanel = DOM.children(this.node.pnls, '.mm-panel_search')[0],
        input = DOM.find(form, 'input')[0],
        cancel = DOM.find(form, '.mm-searchfield__cancel')[0];

    input['mmSearchfield'] = data;

    //	Focus the input in the searchpanel when opening the searchpanel.
    // if (options.panel.add && options.addTo == 'panel') {
    //     this.bind('openPanel:after', (panel: HTMLElement) => {
    //         if (panel === searchpanel) {
    //             input.focus();
    //         }
    //     });
    // }

    //	Search while typing.
    events.off(input, 'input.search');
    events.on(input, 'input.search', (evnt: KeyboardEvent) => {
        switch (evnt.keyCode) {
            case 9: //	tab
            case 16: //	shift
            case 17: //	control
            case 18: //	alt
            case 37: //	left
            case 38: //	top
            case 39: //	right
            case 40: //	bottom
                break;

            default:
                this.search(input);
                break;
        }
    });

    //	Search initially.
    this.search(input);
};


Mmenu.prototype.search = function (
    this: Mmenu,
    input: HTMLInputElement,
    query: string
) {
    var options = this.opts.searchfield,
        configs = this.conf.searchfield;

    query = query || '' + input.value;
    query = query.toLowerCase().trim();

    var data = input['mmSearchfield'];
    var form: HTMLElement = input.closest('.mm-searchfield') as HTMLElement,
        buttons: HTMLElement[] = DOM.find(form as HTMLElement, '.mm-btn'),
        searchpanel: HTMLElement = DOM.children(
            this.node.pnls,
            '.mm-panel_search'
        )[0];

    /** The panels. */
    var panels: HTMLElement[] = data.panels;

    /** The "no results" messages in a cloned array. */
    var noresults: HTMLElement[] = data.noresults;

    /** The listitems in a cloned array. */
    var listitems: HTMLElement[] = data.listitems;

    /** Tje dividers in a cloned array. */
    var dividers: HTMLElement[] = data.dividers;

    //	Reset previous results
    listitems.forEach((listitem) => {
        listitem.classList.remove('mm-listitem--nosubitems');
        listitem.classList.remove('mm-listitem--onlysubitems');
        listitem.classList.remove('mm-hidden');
    });

    if (searchpanel) {
        DOM.children(searchpanel, '.mm-listview')[0].innerHTML = '';
    }

    panels.forEach((panel) => {
        panel.scrollTop = 0;
    });

    //	Search
    if (query.length) {
        //	Initially hide all dividers.
        dividers.forEach((divider) => {
            divider.classList.add('mm-hidden');
        });

        //	Hide listitems that do not match.
        listitems.forEach((listitem) => {
            var text = DOM.children(listitem, '.mm-listitem__text')[0];
            var add = false;

            //  The listitem should be shown if:
            //          1) The text matches the query and
            //          2a) The text is a open-button and
            //          2b) the option showSubPanels is set to true.
            //      or  3a) The text is not an anchor and
            //          3b) the option showTextItems is set to true.
            //      or  4)  The text is an anchor.

            //  1
            if (text && DOM.text(text).toLowerCase().indexOf(query) > -1) {
                
                    add = true;
                
            }

            if (!add) {
                listitem.classList.add('mm-hidden');
            }
        });

        /** Whether or not the query yielded results. */
        var hasResults = listitems.filter(
            (listitem) => !listitem.matches('.mm-hidden')
        ).length;

        //	Show all mached listitems in the search panel
        // if (options.panel.add) {
        //     //	Clone all matched listitems into the search panel
        //     let allitems: HTMLElement[] = [];
        //     panels.forEach((panel) => {
        //         let listitems = DOM.filterLI(DOM.find(panel, '.mm-listitem'));
        //         listitems = listitems.filter(
        //             (listitem) => !listitem.matches('.mm-hidden')
        //         );

        //         if (listitems.length) {
        //             //  Add a divider to indicate in what panel the listitems were.
        //             if (options.panel.dividers) {
        //                 let divider = DOM.create('li.mm-divider');
        //                 let title = DOM.find(panel, '.mm-navbar__title')[0];
        //                 if (title) {
        //                     divider.innerHTML = title.innerHTML;
        //                     allitems.push(divider);
        //                 }
        //             }

        //             listitems.forEach((listitem) => {
        //                 allitems.push(listitem.cloneNode(true) as HTMLElement);
        //             });
        //         }
        //     });

        //     //	Remove toggles and checks.
        //     allitems.forEach((listitem) => {
        //         listitem
        //             .querySelectorAll('.mm-toggle, .mm-check')
        //             .forEach((element) => {
        //                 element.remove();
        //             });
        //     });

        //     //	Add to the search panel.
        //     DOM.children(searchpanel, '.mm-listview')[0].append(...allitems);

        //     //	Open the search panel.
        //     this.openPanel(searchpanel);
        // } else {
            //	Also show listitems in sub-panels for matched listitems
            // if (options.showSubPanels) {
            //     panels.forEach((panel) => {
            //         let listitems = DOM.find(panel, '.mm-listitem');

            //         DOM.filterLI(listitems).forEach((listitem) => {
            //             let child: HTMLElement = DOM.find(this.node.pnls, `#${listitem.dataset.mmChild}`)[0];
            //             if (child) {
            //                 DOM.find(child, '.mm-listitem').forEach(
            //                     (listitem) => {
            //                         listitem.classList.remove('mm-hidden');
            //                     }
            //                 );
            //             }
            //         });
            //     });
            // }

            //	Update parent for sub-panel
            //  .reverse() mutates the original array, therefor we "clone" it first using [...panels].
            [...panels].reverse().forEach((panel, p) => {
                let parent: HTMLElement = DOM.find(this.node.pnls, `#${panel.dataset.mmParent}`)[0];

                if (parent) {
                    //	The current panel has mached listitems
                    let listitems = DOM.find(panel, '.mm-listitem');
                    if (DOM.filterLI(listitems).length) {
                        //	Show parent
                        if (parent.matches('.mm-hidden')) {
                            parent.classList.remove('mm-hidden');
                        }
                        parent.classList.add('mm-listitem--onlysubitems');
                    } else if (!input.closest('.mm-panel')) {
                        if (
                            panel.matches('.mm-panel--opened') ||
                            panel.matches('.mm-panel--parent')
                        ) {
                            //	Compensate the timeout for the opening animation
                            // setTimeout(() => {
                            //     this.openPanel(
                            //         parent.closest('.mm-panel') as HTMLElement
                            //     );
                            // }, (p + 1) * (this.conf.openingInterval * 1.5));
                        }
                        parent.classList.add('mm-listitem--nosubitems');
                    }
                }
            });

            //	Show parent panels of vertical submenus
            panels.forEach((panel) => {
                let listitems = DOM.find(panel, '.mm-listitem');
                DOM.filterLI(listitems).forEach((listitem) => {
                    DOM.parents(listitem, '.mm-listitem--vertical').forEach(
                        (parent) => {
                            if (parent.matches('.mm-hidden')) {
                                parent.classList.remove('mm-hidden');
                                parent.classList.add(
                                    'mm-listitem--onlysubitems'
                                );
                            }
                        }
                    );
                });
            });

            //	Show first preceeding divider of parent
            panels.forEach((panel) => {
                let listitems = DOM.find(panel, '.mm-listitem');
                DOM.filterLI(listitems).forEach((listitem) => {
                    let divider = DOM.prevAll(listitem, '.mm-divider')[0];
                    if (divider) {
                        divider.classList.remove('mm-hidden');
                    }
                });
            });
        // }

        //	Show submit / clear button
        buttons.forEach((button) => button.classList.remove('mm-hidden'));

        //	Show/hide no results message
        noresults.forEach((wrapper) => {
            DOM.find(wrapper, '.mm-panel__noresultsmsg').forEach((message) =>
                message.classList[hasResults ? 'add' : 'remove']('mm-hidden')
            );
        });

        // if (options.panel.add) {
        //     //	Hide splash
        //     if (options.panel.splash) {
        //         DOM.find(searchpanel, '.mm-panel__content').forEach((splash) =>
        //             splash.classList.add('mm-hidden')
        //         );
        //     }

        //     //	Re-show original listitems when in search panel
        //     listitems.forEach((listitem) =>
        //         listitem.classList.remove('mm-hidden')
        //     );
        //     dividers.forEach((divider) =>
        //         divider.classList.remove('mm-hidden')
        //     );
        // }

        //	Don't search
    } else {
        //	Show all items
        listitems.forEach((listitem) => listitem.classList.remove('mm-hidden'));
        dividers.forEach((divider) => divider.classList.remove('mm-hidden'));

        //	Hide submit / clear button
        buttons.forEach((button) => button.classList.add('mm-hidden'));

        //	Hide no results message
        noresults.forEach((wrapper) => {
            DOM.find(wrapper, '.mm-panel__noresultsmsg').forEach((message) =>
                message.classList.add('mm-hidden')
            );
        });

        // if (options.panel.add) {
        //     //	Show splash
        //     if (options.panel.splash) {
        //         DOM.find(searchpanel, '.mm-panel__content').forEach((splash) =>
        //             splash.classList.remove('mm-hidden')
        //         );

        //         //	Close panel
        //     } else if (!input.closest('.mm-panel_search')) {
        //         let opened = DOM.children(
        //             this.node.pnls,
        //             '.mm-panel--parent'
        //         );
        //         this.openPanel(opened.slice(-1)[0]);
        //     }
        // }
    }

};
