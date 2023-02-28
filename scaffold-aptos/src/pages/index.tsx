import {
  DAPP_ADDRESS,
  APTOS_FAUCET_URL,
  APTOS_NODE_URL
} from "../config/constants";
import { useWallet } from "@manahippo/aptos-wallet-adapter";
import { MoveResource } from "@martiandao/aptos-web3-bip44.js/dist/generated";
import { useState, useEffect } from "react";
import {
  AptosAccount,
  WalletClient,
  HexString,
  AptosClient,
} from "@martiandao/aptos-web3-bip44.js";

import { CodeBlock } from "../components/CodeBlock";

import newAxios from "../utils/axios_utils";

import React, { KeyboardEventHandler } from 'react';
import CreatableSelect from 'react-select/creatable';

import VerifyEthAddrBtn from "../components/VerifyEthAddrBtn";
import VerifyAptosAddrBtn from "../components/VerifyAptAddrBtn";

// import { TypeTagVector } from "@martiandao/aptos-web3-bip44.js/dist/aptos_types";
// import {TypeTagParser} from "@martiandao/aptos-web3-bip44.js/dist/transaction_builder/builder_utils";
export default function Home() {
  const { account, signAndSubmitTransaction } = useWallet();
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const [resource, setResource] = React.useState<MoveResource>();
  const [resource_v2, setResourceV2] = React.useState<any>();
  const [addrInfo, setAddrInfo] = React.useState<Array<any>>([]);
  const [hasAddrAggregator, setHasAddrAggregator] = React.useState<boolean>(false);
  const [formInput, updateFormInput] = useState<{
    did_type: number;
    description: string;
    resource_path: string;
    addr_type: number;
    addr: string;
    pubkey: string;
    addr_description: string;
    chains: Array<string>;
    expire_second: number;
  }>({
    did_type: 0,
    description: "",
    resource_path: "",
    addr_type: 0,
    addr: "",
    pubkey: "",
    addr_description: "",
    chains: [],
    expire_second: 0,
  });

  const components = {
    DropdownIndicator: null,
  };

  interface Option {
    readonly label: string;
    readonly value: string;
  }

  const createOption = (label: string) => ({
    label,
    value: label,
  });
  const [inputValue, setInputValue] = React.useState('');
  const [chainsValue, setChainsValue] = React.useState<readonly Option[]>([]);

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (!inputValue) return;
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        setChainsValue((prev) => [...prev, createOption(inputValue)]);
        updateFormInput({ ...formInput, chains: [...formInput.chains, inputValue] })
        setInputValue('');
        event.preventDefault();
    }
  };

  async function init_did() {
    await signAndSubmitTransaction(
      do_init_did(),
      { gas_unit_price: 100 }
    );
  }

  async function create_addr() {
    const test = await signAndSubmitTransaction(
      add_addr(),
      { gas_unit_price: 100 }
    );
    console.log(test);
  }

  async function del_addr() {
    await signAndSubmitTransaction(
      delete_addr(),
      { gas_unit_price: 100 }
    );
  }



  async function get_addr_info() {
    if(account && account.address) {
      const addr_aggregator: any = await client.aptosClient.getAccountResource(account.address.toString(), DAPP_ADDRESS + "::addr_aggregator::AddrAggregator");
      // console.log(addr_aggregator);
      if(addr_aggregator) {
        const addresses: Array<string> = addr_aggregator.data.addrs;
        const addr_infos_map_handle: string = addr_aggregator.data.addr_infos_map.handle;
        // console.log(addresses);
        // console.log(addr_infos_map_handle);
        const out: Array<any> = [];
        for(let i = 0; i < addresses.length; i++) {
          const table_item = await client.aptosClient.getTableItem(addr_infos_map_handle, {
            key_type: "0x1::string::String",
            value_type: DAPP_ADDRESS + "::addr_info::AddrInfo",
            key: addresses[i],
          });
          out.push(table_item);
        }
        console.log(out);
        setAddrInfo(out);
      }
    }
  }

  function do_init_did() {
    const { description, resource_path, addr_type, addr, pubkey, addr_description, chains } = formInput;
    return {
      type: "entry_function_payload",
      function: DAPP_ADDRESS + "::init::init",
      type_arguments: [],
      arguments: [
        0,
        description
      ],
    };
  }

  function add_addr() {
    const { description, resource_path, addr_type, addr, pubkey, addr_description, chains, expire_second } = formInput;
    return {
      type: "entry_function_payload",
      function: DAPP_ADDRESS + "::addr_aggregator::add_addr",
      type_arguments: [],
      arguments: [
        addr_type,
        addr,
        pubkey,
        chains,
        addr_description,
        expire_second,
      ],
    };
  }

  function delete_addr() {
    const { addr } = formInput;
    return {
      type: "entry_function_payload",
      function: DAPP_ADDRESS + "::addr_aggregator::delete_addr",
      type_arguments: [],
      arguments: [
        addr,
      ],
    };
  }

  const render_addr_info = () => {
    let out_array = [];
    for (let i = 0; i < addrInfo.length; i++) {
      out_array.push(
        <tr className="text-center" key={i}>
          <th>{addrInfo[i].addr.substring(0, 10) + "..."}</th>
          <td>{addrInfo[i].addr_type === "0" ? "ETH" : "APT"}</td>
          <td>{addrInfo[i].chains}</td>
          <td>{addrInfo[i].description.length > 20 ? addrInfo[i].description.substring(0, 20) : addrInfo[i].description}</td>
          <td>{new Date(addrInfo[i].created_at * 1000).toLocaleString()}</td>
          <td>{new Date(addrInfo[i].expired_at * 1000).toLocaleString()}</td>
          <td>{addrInfo[i].updated_at === "0" ? "Never" : new Date(addrInfo[i].updated_at * 1000).toLocaleString()}</td>
          <td>{addrInfo[i].signature !== "0x" ? "Yes" : "No"}</td>
          {addrInfo[i].addr_type === "0" ? 
            <VerifyEthAddrBtn addrInfo={addrInfo} addrIndex={i} address={addrInfo[i].addr} verified={addrInfo[i].signature !== "0x"}/> : 
            <VerifyAptosAddrBtn addrInfo={addrInfo} addrIndex={i} address={addrInfo[i].addr} verified={addrInfo[i].signature !== "0x"}/>
          }
        </tr>
      );
    }
    return out_array;
  };

  async function check_addr_aggregator() {
    if(account && account.address) {
      try {
        const addr_aggregator: any = await client.aptosClient.getAccountResource(account.address.toString(), DAPP_ADDRESS + "::addr_aggregator::AddrAggregator");
        console.log(addr_aggregator);
        setHasAddrAggregator(true);
      } catch(err) {
        console.log(err);
        setHasAddrAggregator(false);     
      }
    }
    setHasAddrAggregator(false);
  }

  useEffect(() => {check_addr_aggregator()}, [account])

  return (
    <div>
      <p><b>Module Path:</b> {DAPP_ADDRESS}::addr_aggregator</p>
      {hasAddrAggregator && (
        <>
          <input
            placeholder="Description for your DID"
            className="mt-8 p-4 input input-bordered input-primary w-full"
            onChange={(e) =>
              updateFormInput({ ...formInput, description: e.target.value })
            }
          />
          <br></br>
          <br></br>
          The type of DID Owner: &nbsp; &nbsp; &nbsp; &nbsp;
          <select
            value={formInput.did_type}
            onChange={(e) => {
              updateFormInput({ ...formInput, did_type: parseInt(e.target.value) })
            }}
          >
            <option value="0">Individual</option>
            <option value="1">DAO</option>
          </select>
          <br></br>
          <button
            onClick={init_did}
            className={
              "btn btn-primary font-bold mt-4  text-white rounded p-4 shadow-lg"
            }>
            Init Your DID
          </button> &nbsp; &nbsp; &nbsp; &nbsp; 💡 INIT Your DID on Aptos before the other Operations!
          <br></br>
          <br></br>
        </>
      )}
      <button
        onClick={get_addr_info}
        className={
          "btn btn-primary font-bold mt-4  text-white rounded p-4 shadow-lg"
        }>
        Get DID Resource
      </button>
      {addrInfo && (
        <div className="overflow-x-auto mt-2">
          <h3 className="text-center font-bold">DID Resources</h3>
          <table className="table table-compact w-full my-2">
            <thead>
              <tr className="text-center">
                <th>Address</th>
                <th>Address Type</th>
                <th>Chain(s)</th>
                <th>Description</th>
                <th>Created At</th>
                <th>Expire At</th>
                <th>Updated At</th>
                <th>Verified</th>
                <th>Verify</th>
                <th>Signature</th>
              </tr>
            </thead>
            <tbody>{render_addr_info()}</tbody>
          </table>
        </div>
      )}
      <br></br>
      <select
        value={formInput.addr_type}
        onChange={(e) => {
          updateFormInput({ ...formInput, addr_type: parseInt(e.target.value) })
        }}
      >
        <option value="0">Ethereum Type Addr</option>
        <option value="1">Aptos Type Addr</option>
      </select>
      <br></br>
      <input
        placeholder="Addr"
        className="mt-8 p-4 input input-bordered input-primary w-full"
        onChange={(e) =>
          updateFormInput({ ...formInput, addr: e.target.value })
        }
      />
      <br></br>
      <input
        placeholder="Pubkey(Optional)"
        className="mt-8 p-4 input input-bordered input-primary w-full"
        onChange={(e) =>
          updateFormInput({ ...formInput, pubkey: e.target.value })
        }
      />
      <br></br>
      <input
        placeholder="Addr Description"
        className="mt-8 p-4 input input-bordered input-primary w-full"
        onChange={(e) =>
          updateFormInput({ ...formInput, addr_description: e.target.value })
        }
      />
      <br></br>
      <CreatableSelect
        components={components}
        inputValue={inputValue}
        isClearable
        isMulti
        menuIsOpen={false}
        onChange={(newValue) => {
          setChainsValue(newValue);
          updateFormInput({ ...formInput, chains: newValue.map(x => x.value) })
        }}
        onInputChange={(newValue) => setInputValue(newValue)}
        onKeyDown={handleKeyDown}
        placeholder="Chains"
        value={chainsValue}
        className="mt-8 input-primary w-full select-input"
        styles={{
          control: (_, state) => {
            return {
              // display
              display: 'flex',
              alignItems: 'center',
              // height & width
              width: '100%',
              height: '3rem',
              // outline
              outline: state.isFocused ? '2px solid #570df8' : '0px',
              outlineOffset: '3px',
              // border & padding
              borderRadius: '8px',
              paddingLeft: '0.4rem',
              // size
              fontSize: '1rem',
            }
          },
        }}
      />
      <input
        placeholder="Expire Second"
        className="mt-8 p-4 input input-bordered input-primary w-full"
        onChange={(e) =>
          updateFormInput({ ...formInput, expire_second: parseInt(e.target.value) })
        }
      />
      <br></br>
      <button
        onClick={create_addr}
        className={
          "btn btn-primary font-bold mt-4  text-white rounded p-4 shadow-lg"
        }>
        Add Addr
      </button>
      <br></br>
      <button
        // onClick={create_addr}
        className={
          "btn btn-primary font-bold mt-4  text-white rounded p-4 shadow-lg"
        }>
        Update Addr
      </button>
      <button
        onClick={del_addr}
        className={
          "btn btn-primary font-bold mt-4  text-white rounded p-4 shadow-lg"
        }>
        Delete Addr
      </button>
    </div >
  );
}



  // useEffect(()=>{get_addr_info()}, [account]);

  // async function get_table() {
  //   // client.aptosClient.getTableItem()
  // }

  // async function get_resource() {
  //   const { description, resource_path, addr_type, addr, pubkey, addr_description, chains } = formInput;
  //   console.log(client.aptosClient.getAccountResource(account!.address!.toString(), resource_path));
  // }

  // async function faas_test() {
  //   newAxios.post(
  //     '/api/v1/run?name=DID.Renderer&func_name=get_module_doc',
  //     {
  //       "params": [
  //       ]
  //     },
  //   ).then(
  //     value => {
  //       console.log(value.data);
  //     }
  //   );
  // }
  // async function get_did_resource_v2() {
  //   newAxios.post(
  //     '/api/v1/run?name=DID.Renderer&func_name=gen_did_document',
  //     { "params": [account!.address!.toString(), DAPP_ADDRESS] },
  //   ).then(
  //     value => {
  //       console.log(value.data)
  //       setResourceV2(value.data)
  //     }
  //   );
  // }

  // async function get_did_resource() {

  //   client.aptosClient.getAccountResource(account!.address!.toString(), DAPP_ADDRESS + "::addr_aggregator::AddrAggregator").then(
  //     setResource
  //   );
  // }


  // function log_acct() {
  //   console.log(resource)
  //   console.log(account!.address!.toString());
  // }

  
  // const render_did_resource_v2 = () => {
  //   let out_array = [];
  //   const data = resource_v2.result.verification_methods;
  //   for (let i = 0; i < data.length; i++) {
  //     out_array.push(
  //       <tr className="text-center" key={i}>
  //         <th>{data[i].addr.substring(0, 10) + "..."}</th>
  //         <td>{data[i].verificated.toString()}</td>
  //         <td>{data[i].properties.chains}</td>
  //         <td>{data[i].type}</td>
  //         {data[i].addr.length === 42 ? 
  //           <VerifyEthAddrBtn resource_v2={resource_v2} addrIndex={i} address={data[i].addr} verified={data[i].verificated}/> : 
  //           <VerifyAptosAddrBtn resource_v2={resource_v2} addrIndex={i} address={data[i].addr} verified={data[i].verificated}/>
  //         }
  //       </tr>
  //     );
  //   }
  //   return out_array;
  // };