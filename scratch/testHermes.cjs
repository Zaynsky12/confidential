const id = 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${id}`)
  .then(r => r.json())
  .then(data => {
    console.log("binary data:", data.binary.data);
  });
