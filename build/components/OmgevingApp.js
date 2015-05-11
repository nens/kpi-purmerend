/**
 * @jsx React.DOM
 */

var React = require('react/addons');
var cx = React.addons.classSet;

require("!style!css!./KPIApp.css");
require("!style!css!./Colorbrewer.css");

var moment = require('moment');
var Router = require('react-router');
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var Row = require('react-bootstrap').Row;
var Accordion = require('react-bootstrap').Accordion;
var Panel = require('react-bootstrap').Panel;
var Grid = require('react-bootstrap').Grid;
var Label = require('react-bootstrap').Label;
var Col = require('react-bootstrap').Col;
var ModalTrigger = require('react-bootstrap').ModalTrigger;
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var Button = require('react-bootstrap').Button;
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var Tooltip = require('react-bootstrap').Tooltip;

var Modal = require('react-bootstrap').Modal;
var Badge = require('react-bootstrap').Badge;
var TabbedArea = require('react-bootstrap').TabbedArea;
var TabPane = require('react-bootstrap').TabPane;
var DropdownButton = require('react-bootstrap').DropdownButton;
var MenuItem = require('react-bootstrap').MenuItem;
var Table = require('react-bootstrap').Table;
var Promise = require('es6-promise').Promise;

var $ = require('jquery');
var d3 = require('d3');
require('../libs/d3.tip.js');

var debug = require('debug')('OmgevingApp.js');

var weightSettings = require('./WeightSettings').Omgeving;

var iconTevredenheid = require('../images/icon-tevredenheid.png');
var iconToestand = require('../images/icon-toestand.png');
var iconOmgeving = require('../images/icon-omgeving.png');
var iconGebruik = require('../images/icon-gebruik.png');
var iconPlanning = require('../images/icon-planning.png');
var iconLizard = require('../images/icon-lizard.png');

var Map = require('./Map');
var KPIModal = require('./KPIModal');
var Histo = require('./Histo');
var config = require('../config');
var kaart, lineChart, histoChart;



var OmgevingApp = React.createClass({
    getInitialState: function() {
        return {
            pis: [],
            stadsdeel: config.cityName
        };
    },
    handleStadsdeelClick: function(stadsdeel) {
        if(this.state.stadsdeel === stadsdeel) {
            debug('De-selecting ' + stadsdeel + ', selecting ' + config.cityName);
            this.setState({'stadsdeel': config.cityName});
        } else {
            debug('Selecting ' + stadsdeel);
            this.setState({'stadsdeel': stadsdeel});            
        }
    },
    componentDidMount: function() {
        var self = this;

        d3.csv("static/data/" + config.csvFileOmgeving, function (csv) {

            // Format the csv (parse month/year to better date etc)
            csv.map(function(d) {
                d.Date = moment(d.Date, 'MMM/YY').format('MM/DD/YYYY');
                d.month = moment(d.Date).month() + 1; // Zero-based!
            });

            // Group the data by PI
            var data = d3.nest()
                .key(function(d) { return d.PI; })
                .entries(csv);

            var pisArray = data.map(function(obj) {
                return {
                    'key':obj.key, 
                    'values': obj.values
                };
            });
            self.setState({'pis': pisArray});
            self.setState({'stadsdeel': config.cityName});
        });

        window.addEventListener('scroll', function(e){
            var distanceY = window.pageYOffset || document.documentElement.scrollTop,
                shrinkOn = 135;

            if (distanceY > shrinkOn) {
                $('#fixedheader').addClass('fixme');
            } else {
                $('#fixedheader').removeClass('fixme');
            }
        });        

    },
    handleSelection: function(selection) {
        this.setState({
            activeSelection: selection.title
        });
        return selection;
    },
    setRefVal: function(val) {
        // console.log('setRefVal', val);
        // this.setState({
        //     refval: val
        // });
        return val;
    },        
    render: function() {

        var self = this;
        var perGebied, filteredPIList, currentPIValues = [];

        if(self.state.stadsdeel && self.state.activeSelection) {
            filteredPIList = self.state.pis.filter(function(pi) {
                if(pi.key === self.state.activeSelection) return pi;
            })[0].values;

            perGebied = d3.nest()
                .key(function(d) {
                    return d.Gebied;
                })
                .entries(filteredPIList);
        }


        var histograms = self.state.pis.map(function(pigroup, i) {

            var values;
            var title = pigroup.key;
            var filteredValues = d3.nest()
                .key(function(d) {
                    return d.Gebied;
                })
                .entries(pigroup.values);

            if(self.state.stadsdeel === config.cityName) {
                values = filteredValues.filter(function(v) { if(v.key === config.cityName) return v; });    
            } else {
                values = filteredValues.filter(function(v) { if(v.key === self.state.stadsdeel) return v; });
            }

            return <Histo
                        active={(self.state.activeSelection === title) ? true : false}
                        key={i} 
                        tabIndex={i+1}
                        title={title}
                        period={window.period}
                        setRefVal={self.setRefVal}
                        handleSelection={self.handleSelection}
                        values={values.length < 1 ? [] : values[0].values} />
        });


        return (
              <Grid>
                <Row>
                    <Col md={6} xs={12} id="fixedheader" style={{margin:'0 0 10px 0'}}>
                        <h2 style={{fontSize:'2em'}}>
                            <a href="#" className="home"><i className="fa fa-arrow-circle-o-left"/></a>&nbsp;<strong>KPI Omgevingseffect</strong>&nbsp;

                            <ModalTrigger modal={<KPIModal weightData={weightSettings} />}>
                                <Label style={{float:'right', cursor: 'pointer', fontSize:'1.1em',backgroundColor:Utils.quantize(this.props.kpiValue)}}>KPI: {Math.round(this.props.kpiValue)}</Label>
                            </ModalTrigger>
      
                            <ModalTrigger modal={<InfoModal />}>
                                <i style={{cursor: 'pointer'}} className="fa fa-info-circle" />
                            </ModalTrigger>                            
                            <a target="_blank"
                               href="https://demo.lizard.net/map/topography,waterchain,message/area/@52.5068,4.9593,13/Jan,01,2014-Jan,01,2015">
                               <OverlayTrigger placement="bottom" overlay={<Tooltip><strong>Bekijken in Lizard</strong></Tooltip>}>                               
                                   <img width="25" style={{margin:'0px 0px 5px 5px'}} src={iconLizard} />
                               </OverlayTrigger>
                            </a>
                        </h2>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} md={6}>
                        {histograms}
                    </Col>
                    <Col xs={12} md={6} style={{textAlign:'left'}}>
                        <Map selectStadsdeel={this.handleStadsdeelClick}
                             perGebied={perGebied}
                             activeSelection={this.state.activeSelection}
                             stadsdeel={this.state.stadsdeel} />
                    </Col>                    
                </Row>
              </Grid>
        );
    }
});




var InfoModal = React.createClass({
  render: function() {
    return this.transferPropsTo(
        <Modal title="Omgevingseffect" animation={true}>
          <div className="modal-body">
            <h3>Doel</h3>
            <p>We bepalen deze KPI op basis van de volgende Performance Indicators:
                <ul>
                    <li>Meldingen</li>
                    <li>Social media</li>
                    <li>Enquetes</li>
                    <li>Schadeclaims</li>
                </ul>
            </p>
            <p>Door op een PI te klikken ziet u de trendlijn voor de ingestelde periode.</p>
            <h3>PI waarde of data waarde</h3>
            <p>Door op de het gekleurde label in de titelbalk van een grafiek te klikken of tappen wisselt de grafiek tussen PI-waarde en data-waarde.</p>
          </div>
          <div className="modal-footer">
            <Button onClick={this.props.onRequestHide}>Sluiten</Button>
          </div>
        </Modal>
      );
  }
});


module.exports = OmgevingApp;