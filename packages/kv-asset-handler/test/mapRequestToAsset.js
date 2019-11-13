import test from 'ava'
import { mockGlobal } from '../src/mocks'
import { mapRequestToAsset } from '../dist/index'

test('mapRequestToAsset() correctly changes /about -> /about/index.html', async t => {
  mockGlobal()
  let path = '/about'
  let request = new Request(`https://foo.com${path}`)
  let newRequest = mapRequestToAsset(request)
  t.is(newRequest.url, request.url + '/index.html')
})

test('mapRequestToAsset() correctly changes /about/ -> /about/index.html', async t => {
  let path = '/about/'
  let request = new Request(`https://foo.com${path}`)
  let newRequest = mapRequestToAsset(request)
  t.is(newRequest.url, request.url + 'index.html')
})

test('mapRequestToAsset() correctly changes /about.me/ -> /about.me/index.html', async t => {
  let path = '/about.me/'
  let request = new Request(`https://foo.com${path}`)
  let newRequest = mapRequestToAsset(request)
  t.is(newRequest.url, request.url + 'index.html')
})
