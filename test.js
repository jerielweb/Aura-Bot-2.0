
import { request, fetch, Agent, setGlobalDispatcher } from 'undici';

// Use undici.request for maximum performance
const { body } = await request("https://api.alyacore.xyz/search/soundcloud?query=Hola&key=oboe");
const data = await body.json();
console.log(data);

// Or use undici.fetch with custom configuration
const agent = new Agent({ keepAliveTimeout: 10000 });
setGlobalDispatcher(agent);
const response = await fetch('https://api.alyacore.xyz/search/soundcloud?query=Hola&key=oboe');

const jsonData = await response.json();
console.log(jsonData);
