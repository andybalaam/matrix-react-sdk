/*
Copyright 2019 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import PropTypes from 'prop-types';
import MatrixClientPeg from '../../../MatrixClientPeg';
import sdk from '../../../index';
import { _t } from '../../../languageHandler';
import {verificationMethods} from 'matrix-js-sdk/lib/crypto';

const PHASE_START = 0;
const PHASE_SHOW_SAS = 1;
const PHASE_WAIT_FOR_PARTNER_TO_CONFIRM = 2;
const PHASE_VERIFIED = 3;
const PHASE_CANCELLED = 4;

export default class IncomingSasDialog extends React.Component {
    static propTypes = {
        verifier: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);

        this._showSasEvent = null;
        this.state = {
            phase: PHASE_START,
            sasVerified: false,
        };
        this.props.verifier.on('show_sas', this._onVerifierShowSas);
        this.props.verifier.on('cancel', this._onVerifierCancel);
    }

    componentWillUnmount() {
        if (this.state.phase !== PHASE_CANCELLED && this.state.phase !== PHASE_VERIFIED) {
            this.props.verifier.cancel('User cancel');
        }
        this.props.verifier.removeListener('show_sas', this._onVerifierShowSas);
    }

    _onFinished = () => {
        this.props.onFinished(this.state.phase === PHASE_VERIFIED);
    }

    _onCancelClick = () => {
        this.props.onFinished(this.state.phase === PHASE_VERIFIED);
    }

    _onContinueClick = () => {
        this.setState({phase: PHASE_WAIT_FOR_PARTNER_TO_CONFIRM});
        this.props.verifier.verify().then(() => {
            this.setState({phase: PHASE_VERIFIED});
        }).catch((e) => {
            console.log("Verification failed", e);
        });
    }

    _onVerifierShowSas = (e) => {
        this._showSasEvent = e;
        this.setState({
            phase: PHASE_SHOW_SAS,
            sas: e.sas,
        });
    }

    _onVerifierCancel = (e) => {
        this.setState({
            phase: PHASE_CANCELLED,
        });
    }

    _onVerifiedStateChange = (newVal) => {
        this.setState({sasVerified: newVal});
    }

    _onSasMatchesClick = () => {
        this._showSasEvent.confirm();
        this.setState({
            phase: PHASE_WAIT_FOR_PARTNER_TO_CONFIRM,
        });
    }

    _onVerifiedDoneClick = () => {
        this.props.onFinished(true);
    }

    _renderPhaseStart() {
        const DialogButtons = sdk.getComponent('views.elements.DialogButtons');

        return (
            <div>
                <h2>{this.props.verifier.userId}</h2>
                <p>{_t(
                    "Verify this user to mark them as trusted. " +
                    "Trusting users gives you extra peace of mind when using " +
                    "end-to-end encrypted messages."
                )}</p>
                <p>{_t(
                    // NB. Below wording adjusted to singular 'device' until we have
                    // cross-signing
                    "Verifying this user will mark their device as trusted, and " +
                    "also mark your device as trusted to them"
                )}</p>
                <DialogButtons
                    primaryButton={_t('Continue')}
                    hasCancel={true}
                    onPrimaryButtonClick={this._onContinueClick}
                    onCancel={this._onCancelClick}
                />
            </div>
        );
    }

    _renderPhaseShowSas() {
        const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
        const HexVerify = sdk.getComponent('views.elements.HexVerify');
        return <div>
            <p>{_t(
                "Verify this user by confirming the following number appears on their screen"
            )}</p>
            <p>{_t(
                "For maximum security, we reccommend you do this in person or use another " +
                "trusted means of communication"
            )}</p>
            <HexVerify text={this._showSasEvent.sas}
                onVerifiedStateChange={this._onVerifiedStateChange}
            />
            <p>{_t(
                "To continue, click on each pair to confirm it's correct.",
            )}</p>
            <DialogButtons onPrimaryButtonClick={this._onSasMatchesClick}
                primaryButton={_t("Continue")}
                primaryDisabled={!this.state.sasVerified}
                hasCancel={true}
                onCancel={this._onCancelClick}
            />
        </div>;
    }

    _renderPhaseWaitForPartnerToConfirm() {
        const Spinner = sdk.getComponent("views.elements.Spinner");

        return (
            <div>
                <Spinner />
                <p>{_t("Waiting for partner to confirm...")}</p>
            </div>
        );
    }

    _renderPhaseVerified() {
        const DialogButtons = sdk.getComponent('views.elements.DialogButtons');

        return (
            <div>
                <p>{_t(
                    "Verification Complete!"
                )}</p>
                <DialogButtons
                    primaryButton={_t('Done')}
                    hasCancel={false}
                    onPrimaryButtonClick={this._onVerifiedDoneClick}
                />
            </div>
        );
    }

    _renderPhaseCancelled() {
        const DialogButtons = sdk.getComponent('views.elements.DialogButtons');

        return (
            <div>
                <p>{_t(
                    "The other party cancelled the verification."
                )}</p>
                <DialogButtons
                    primaryButton={_t('Cancel')}
                    hasCancel={false}
                    onPrimaryButtonClick={this._onCancelClick}
                />
            </div>
        );
    }

    render() {
        let body;
        switch (this.state.phase) {
            case PHASE_START:
                body = this._renderPhaseStart();
                break;
            case PHASE_SHOW_SAS:
                body = this._renderPhaseShowSas();
                break;
            case PHASE_WAIT_FOR_PARTNER_TO_CONFIRM:
                body = this._renderPhaseWaitForPartnerToConfirm();
                break;
            case PHASE_VERIFIED:
                body = this._renderPhaseVerified();
                break;
            case PHASE_CANCELLED:
                body = this._renderPhaseCancelled();
                break;
        }

        const BaseDialog = sdk.getComponent("dialogs.BaseDialog");
        return (
            <BaseDialog
                title={_t("Incoming Verification Request")}
                onFinished={this._onFinished}
            >
                {body}
            </BaseDialog>
        );
    }
}

