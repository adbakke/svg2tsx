import Head from "next/head";

import copy from "@/data/copy/en-EN.json";

import { AppBar } from "@/components/AppBar";
import { AppCodeDeck } from "@/components/AppCodeDeck";
import { AppBarSettings } from "@/components/AppBarSettings";
import { BatchProcessor } from '@/components/BatchProcessor/BatchProcessor';

export default () => {
  return (
    <>
      <Head>
        <title>{copy.META_TITLE}</title>
      </Head>

      <AppBar />
      <AppBarSettings />
      <AppCodeDeck />
      <BatchProcessor />
    </>
  );
};
