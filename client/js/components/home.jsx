"use strict";

import _            from 'lodash';
import React        from 'react';
import { connect }  from 'react-redux';

import { startApp }            from '../actions/app';
import * as AssessmentActions  from '../actions/assessments';
import assets                  from '../libs/assets';
import AdminPreview            from './admin_preview';
import FilterTree              from './filter_tree';
import AssessmentList          from './assessment_list';

const select = (state) => (state);

export class Home extends React.Component {

  constructor(){
    super();
    this.state = {
      assessmentClicked: {},
      isOpen: false,
      expandedBankPaths: new Set(),
      assessments: {},
      currentBankId: null,
      nOfM: null
    };
    Object.freeze(this.state);
  }

  componentWillMount() {
    let p = this.props;
    if(p.auth.authenticated && !p.application.started) {
      p.startApp(p.auth.auth_token, this.props.settings.qBankHost);
    }
  }

  onMessage(message) {
    // The react dev tools send a javascript object as a message. The player
    // sends a string. This handles that.
    let data = message.data;
    if(typeof message.data === "string") {
      data = JSON.parse(data);
    }

    switch(data.open_assessments_msg) {
      case "open_assessments_available_locales":
        this.props.setAvailableLocales(data.available_locales);
        break;

      case "open_assessments_resize":
        let iframe = document.getElementById("openassessments_container");
        if(iframe) {
          let height = data.payload.height;
          iframe.style.height = height + "px";
        }
        break;
      case "scrollToTop":
        let scrollElement = document.getElementsByClassName('c-preview-scroll')[0];
        scrollElement.scrollTop = 0;
        break;
    }
  }

  componentDidMount(){
    window.addEventListener("message", (message) => this.onMessage(message), false);
  }

  componentDidUpdate() {
    let iframe = document.getElementById('openassessments_container');

    if(!iframe){ return; }

    iframe.contentWindow.postMessage({
      'open_assessments_msg': 'open_assessments_size_request',
      'payload': {}
    }, '*');
  }

  closeAssessmentView() {
    this.props.clearItems();
    this.props.clearAssessmentOffered();
    this.setState({
      isOpen: false,
      assessmentClicked: {},
      currentBankId: null,
      nOfM: null
    });
  }

  offerAssessment(bankId, assessment){
    this.setState({
      isOpen: true,
      assessmentClicked: assessment,
      currentBankId: bankId
    });

    var qBankHost = this.props.settings.qBankHost;
    this.props.offerAssessment(bankId, assessment.id, qBankHost);
    this.props.getItems(bankId, assessment.id, qBankHost);
  }

  setNOfM(n) {
    // If n of m is null, we default it to -1 in the lambda function
    let nOfM = n;
    if(n === this.props.items.length) {
      nOfM = null;
    }

    this.setState({ nOfM });

    this.props.offerAssessment(
      this.state.currentBankId,
      this.state.assessmentClicked.id,
      this.props.settings.qBankHost,
      nOfM
    );
  }

  onChangeLocale(event) {
    const iframe = document.getElementById("openassessments_container");
    const locale = event.target.value;
    iframe.contentWindow.postMessage({
      open_assessments_msg: "open_assessments_set_locale",
      locale
    }, "*");
  }

  onUpdateBankPaths(expandedBankPaths){
    this.setState({expandedBankPaths});
  }

  filterItemClicked(paths) {
    this.onUpdateBankPaths(paths);
    this.closeAssessmentView();
  }

  render() {
    const hierarchy = this.props.banks;
    let error = this.props.application.error;
    let side;
    let content;

    if(error !== undefined) {
      side = null;
      content = <p className="c-admin-error">{error}</p>;
    } else {
      side = (
        <FilterTree
            expandedBankPaths={this.state.expandedBankPaths}
            itemClicked={(paths) => this.filterItemClicked(paths)}
            banks={this.props.banks} />
        );
      content = (
        <AssessmentList
          banks={this.props.banks}
          assessmentClick={(id, assessment) => this.offerAssessment(id, assessment)}
          expandedBankPaths={this.state.expandedBankPaths} />
      );
    }

    return (
      <div style={{"height": "100%"}}>
        <div className="o-admin-container">
          <div className="o-sidebar">
            <div className="c-sidebar__header">
              <img src="" alt="" />
            </div>
            <div className="c-sidebar__filters">
              <p className="c-filters__title">Filter Tree</p>
              {side}
            </div>
          </div>
          <div className="o-admin-content">
            <div className="c-admin-content__main  c-admin-content__main--scroll">
              {content}
            </div>
          </div>
        </div>
        <AdminPreview
          isOpen={this.state.isOpen}
          assessmentClicked={this.state.assessmentClicked}
          settings={this.props.settings}
          locales={this.props.locales}
          nOfM={this.state.nOfM}
          M={this.props.items.length}
          assessmentOffered={this.props.assessment_offered}
          closeAssessmentView={() => this.closeAssessmentView()}
          setNOfM={(n) => this.setNOfM(n)}
          onChangeLocale={(e) => this.onChangeLocale(e)}/>
      </div>
    );
  }
}

export default connect(select, { startApp, ...AssessmentActions })(Home);
